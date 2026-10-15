import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { ProductionTypeEntity } from './entities/production_types.entity.js';
import { LikeEntity } from './entities/like.entity.js';
import { UserEntity } from '../users/entities/user.entity.js';
import { MinioSimpleService } from './minio.service.js';
import { SessionService } from '../session/session.service.js';
import { ProductionFiltersDto } from './dto/production-filters.dto.js';
import { CreateProductionDto } from './dto/create-production.dto.js';
import { UpdateProductionDto } from './dto/update-production.dto.js';
import 'multer';

@Injectable()
export class ProductionTypesService {
  constructor(
    @InjectRepository(ProductionTypeEntity)
    private readonly productionRepo: Repository<ProductionTypeEntity>,
    @InjectRepository(LikeEntity)
    private readonly likeRepo: Repository<LikeEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly minioService: MinioSimpleService,
    private readonly sessionService: SessionService,
  ) {}

  async getUserIdBySession(sessionId: string): Promise<number | null> {
    return this.sessionService.getUserId(sessionId);
  }

  private async mapResponse(item: ProductionTypeEntity, currentUserId: number | null) {
    const likesCount = await this.likeRepo.count({
      where: { production_id: item.production_id },
    });
    const isCreator = currentUserId && item.creator_id === currentUserId ? 1 : 0;

    let isLiked = 0;
    if (currentUserId) {
      const existingLike = await this.likeRepo.findOne({
        where: {
          production_id: item.production_id,
          user_id: currentUserId,
        },
      });
      isLiked = existingLike ? 1 : 0;
    }

    return {
      production_id: item.production_id,
      craft_title: item.craft_title,
      description: item.description ?? null,
      production_output_rate: item.production_output_rate ?? null,
      defect_waste_quantity: item.defect_waste_quantity ?? null,
      image_url: (await this.minioService.getSignedUrl(item.image_key)) ?? null,
      video_url: (await this.minioService.getSignedUrl(item.video_key)) ?? null,
      likes_count: likesCount,
      is_creator: isCreator,
      is_liked: isLiked,
      created_at: item.created_at,
      formed_at: item.formed_at ?? null,
    };
  }

  async find_all_published(filters: ProductionFiltersDto, currentUserId: number | null) {
    const min = filters.min_rate ?? 0;
    const max = filters.max_rate ?? 200;

    const items = await this.productionRepo.find({
      where: {
        status: 'published',
        production_output_rate: Between(Math.min(min, max), Math.max(min, max)),
      },
      order: { production_id: 'ASC' },
      relations: { creator: true },
    });

    return Promise.all(items.map(item => this.mapResponse(item, currentUserId)));
  }

  async find_feed_item(id: number, next?: boolean, currentUserId?: number | null) {
    let item: ProductionTypeEntity | null = null;

    if (next) {
      item = await this.productionRepo.findOne({
        where: { status: 'published', production_id: MoreThan(id) },
        order: { production_id: 'ASC' },
        relations: { creator: true },
      });
      if (!item) {
        item = await this.productionRepo.findOne({
          where: { status: 'published' },
          order: { production_id: 'ASC' },
          relations: { creator: true },
        });
      }
    } else {
      item = await this.productionRepo.findOne({
        where: { production_id: id, status: 'published' },
        relations: { creator: true },
      });
    }

    if (!item) throw new NotFoundException();
    return this.mapResponse(item, currentUserId ?? null);
  }

  async find_draft(currentUserId: number) {
    const draft = await this.productionRepo.findOne({
      where: { status: 'draft', creator_id: currentUserId },
      relations: { creator: true },
    });
    if (!draft) return null;
    return this.mapResponse(draft, currentUserId);
  }

  async create_draft(
    dto: CreateProductionDto,
    currentUserId: number,
    image?: Express.Multer.File,
    video?: Express.Multer.File,
  ) {
    const existing = await this.productionRepo.findOne({
      where: { status: 'draft', creator_id: currentUserId },
    });
    if (existing) throw new BadRequestException();

    const user = await this.userRepo.findOne({ where: { user_id: currentUserId } });
    if (!user) throw new NotFoundException();

    const maxRes = await this.productionRepo
      .createQueryBuilder('p')
      .select('MAX(p.production_id)', 'max')
      .getRawOne();
    const newId = (Number(maxRes?.max) || 0) + 1;

    const draft = this.productionRepo.create({
      production_id: newId,
      craft_title: dto.craft_title,
      status: 'draft',
      creator_id: currentUserId,
      image_key: 'default-image.jpg',
      video_key: 'default-video.mp4',
    });

    let saved = await this.productionRepo.save(draft);

    if (image) {
      saved.image_key = await this.minioService.uploadMedia(image.buffer, image.originalname, saved.production_id, 'image');
    }
    if (video) {
      saved.video_key = await this.minioService.uploadMedia(video.buffer, video.originalname, saved.production_id, 'video');
    }

    saved = await this.productionRepo.save(saved);
    return this.mapResponse(saved, currentUserId);
  }

  async publish_draft(id: number, currentUserId: number, dto: UpdateProductionDto) {
    const draft = await this.productionRepo.findOne({
      where: { production_id: id, status: 'draft', creator_id: currentUserId },
      relations: { creator: true },
    });
    if (!draft) throw new NotFoundException();

    if (dto.craft_title) draft.craft_title = dto.craft_title;
    if (dto.description !== undefined) draft.description = dto.description ?? null;
    if (dto.production_output_rate !== undefined) draft.production_output_rate = dto.production_output_rate;
    if (dto.defect_waste_quantity !== undefined) draft.defect_waste_quantity = dto.defect_waste_quantity;

    draft.status = 'published';
    draft.formed_at = new Date();

    await this.productionRepo.save(draft);
    return this.mapResponse(draft, currentUserId);
  }

  async softDeleteBySql(id: number, currentUserId: number): Promise<void> {
    const existing = await this.productionRepo.findOne({
      where: { production_id: id, creator_id: currentUserId },
    });
    if (!existing || existing.status === 'deleted') {
      throw new NotFoundException();
    }

    await this.productionRepo.query(
      `UPDATE production_types SET status = 'deleted' WHERE production_id = $1 AND creator_id = $2`,
      [id, currentUserId],
    );
  }

  async handleLike(productionId: number, currentUserId: number, action: number): Promise<void> {
    const service = await this.productionRepo.findOne({
      where: { production_id: productionId, status: 'published' },
    });
    if (!service) throw new NotFoundException();

    const existingLike = await this.likeRepo.findOne({
      where: { production_id: productionId, user_id: currentUserId },
    });

    if (action === 1 && !existingLike) {
      const newLike = this.likeRepo.create({
        production_id: productionId,
        user_id: currentUserId,
      });
      await this.likeRepo.save(newLike);
    } else if (action === 0 && existingLike) {
      await this.likeRepo.remove(existingLike);
    }
  }
}