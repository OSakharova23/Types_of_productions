import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { ProductionTypeEntity } from './entities/production_types.entity.js';
import { LikeEntity } from './entities/like.entity.js';

type ProductionWithLikes = ProductionTypeEntity & { likes_count: number };

@Injectable()
export class ProductionTypesService {
  constructor(
    @InjectRepository(ProductionTypeEntity)
    private readonly productionRepo: Repository<ProductionTypeEntity>,
    @InjectRepository(LikeEntity)
    private readonly likeRepo: Repository<LikeEntity>,
  ) {}

  async find_all_published(minRate = 0, maxRate = 200): Promise<ProductionWithLikes[]> {
    const items = await productionRepoQueryFiltered(this.productionRepo, minRate, maxRate);
    const result: ProductionWithLikes[] = [];
    for (const item of items) {
      const likesCount = await this.likeRepo.count({
        where: { production_id: item.production_id },
      });
      result.push({ ...item, likes_count: likesCount });
    }
    return result;
  }

  async find_draft(): Promise<ProductionTypeEntity | null> {
    return this.productionRepo.findOne({
      where: { status: 'draft', creator_id: 1 },
    });
  }

  async find_feed_item(id?: number, next?: boolean): Promise<ProductionWithLikes | null> {
    let item: ProductionTypeEntity | null = null;

    if (!id) {
      // Получаем самую первую опубликованную карточку (LIMIT 1)
      item = await this.productionRepo.findOne({
        where: { status: 'published' },
        order: { production_id: 'ASC' },
      });
    } else if (next) {
      // Получаем следующую карточку (у которой ID больше текущего) одной строкой из БД
      item = await this.productionRepo.findOne({
        where: { 
          status: 'published', 
          production_id: MoreThan(id) 
        },
        order: { production_id: 'ASC' },
      });

      // Если следующей нет (дошли до конца), циклично возвращаем самую первую
      if (!item) {
        item = await this.productionRepo.findOne({
          where: { status: 'published' },
          order: { production_id: 'ASC' },
        });
      }
    } else {
      // Если передана конкретная ID
      item = await this.productionRepo.findOne({
        where: { production_id: id, status: 'published' },
      });
    }

    if (!item) return null;

    const likesCount = await this.countLikes(item.production_id);
    return { ...item, likes_count: likesCount };
  }

  async countLikes(productionId: number): Promise<number> {
    return this.likeRepo.count({ where: { production_id: productionId } });
  }

  // ========== ГРАНИЦЫ ДИАПАЗОНА ФИЛЬТРА (только published) ==========
  async get_rate_bounds(): Promise<{ min: number; max: number }> {
    const result = await this.productionRepo
      .createQueryBuilder('p')
      .select('MIN(p.production_output_rate)', 'min')
      .addSelect('MAX(p.production_output_rate)', 'max')
      .where('p.status = :status', { status: 'published' })
      .getRawOne();

    const min = Number(result?.min ?? 0);
    const max = Number(result?.max ?? 200);

    // если границы совпали (одна карточка или все одинаковые) — расширяем,
    // чтобы слайдер не схлопнулся в точку
    if (min === max) {
      return { min: 0, max: max === 0 ? 200 : max };
    }
    return { min, max };
  }

  // ========== СОЗДАНИЕ ЧЕРНОВИКА (кнопка «Далее») ==========
    // ========== СОЗДАНИЕ ЧЕРНОВИКА (кнопка «Далее») ==========
  async create_draft(data: {
    craft_title?: string;
    image_key?: string;
    video_key?: string;
  }): Promise<ProductionTypeEntity> {
    const existing = await this.productionRepo.findOne({
      where: { status: 'draft', creator_id: 1 },
    });
    if (existing) return existing;

    const maxResult = await this.productionRepo
      .createQueryBuilder('p')
      .select('MAX(p.production_id)', 'max')
      .getRawOne();
    const newId = (Number(maxResult?.max) || 0) + 1;

    const draft = new ProductionTypeEntity();
    draft.production_id = newId;
    draft.craft_title =
      data.craft_title && data.craft_title.trim() !== ''
        ? data.craft_title
        : 'Новый тип производства';
    draft.description = null;

    // URL обязательные — если пусто, ставим дефолтные имена файлов
    draft.image_key =
      data.image_key && data.image_key.trim() !== ''
        ? data.image_key
        : 'default-image.jpg';
    draft.video_key =
      data.video_key && data.video_key.trim() !== ''
        ? data.video_key
        : 'default-video.mp4';

    draft.production_output_rate = null;
    draft.defect_waste_quantity = null;
    draft.status = 'draft';
    draft.creator_id = 1;

    return this.productionRepo.save(draft);
  }

  // ========== ПУБЛИКАЦИЯ ЧЕРНОВИКА (кнопка «Опубликовать») ==========
    // ========== ПУБЛИКАЦИЯ ЧЕРНОВИКА (кнопка «Опубликовать») ==========
  async publish_draft(data: {
    craft_title?: string;
    description?: string;
    production_output_rate: string;
    defect_waste_quantity: string;
  }): Promise<void> {
    const draft = await this.productionRepo.findOne({
      where: { status: 'draft', creator_id: 1 },
    });
    if (!draft) return;

    // Дефолтное название, если поле пустое или состоит из пробелов
    draft.craft_title =
      data.craft_title && data.craft_title.trim() !== ''
        ? data.craft_title
        : 'Новый тип производства';

    // Если описание пустое — пишем null
    draft.description =
      data.description && data.description.trim() !== ''
        ? data.description
        : null;

    // Если число не введено — пишем null, иначе конвертируем строку в число
    draft.production_output_rate =
      data.production_output_rate && data.production_output_rate.trim() !== ''
        ? Number(data.production_output_rate)
        : null;

    draft.defect_waste_quantity =
      data.defect_waste_quantity && data.defect_waste_quantity.trim() !== ''
        ? Number(data.defect_waste_quantity)
        : null;

    draft.status = 'published';
    draft.formed_at = new Date();
    await this.productionRepo.save(draft);
  }

  // ========== УДАЛЕНИЕ ЧЕРЕЗ SQL UPDATE ==========
  async softDeleteBySql(productionId: number): Promise<void> {
    await this.productionRepo.query(
      `UPDATE production_types SET status = 'deleted' WHERE production_id = $1`,
      [productionId],
    );
  }
}

async function productionRepoQueryFiltered(
  repo: Repository<ProductionTypeEntity>,
  min: number,
  max: number,
): Promise<ProductionTypeEntity[]> {
  return repo.find({
    where: {
      status: 'published',
      production_output_rate: Between(Math.min(min, max), Math.max(min, max)),
    },
    order: { production_id: 'ASC' },
  });
}