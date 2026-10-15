import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  ParseBoolPipe,
  DefaultValuePipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ProductionTypesService } from './production_types.service.js';
import { ProductionFiltersDto } from './dto/production-filters.dto.js';
import { CreateProductionDto } from './dto/create-production.dto.js';
import { UpdateProductionDto } from './dto/update-production.dto.js';
import { LikeDto } from './dto/like.dto.js';
import { SessionGuard } from '../auth/guards/session.guard.js';
import type { Request } from 'express';
import 'multer';

@Controller('production_types')
export class ProductionTypesController {
  constructor(private readonly productionTypesService: ProductionTypesService) {}

  @Get()
  async getList(
    @Query() filters: ProductionFiltersDto,
    @Req() req: Request,
  ) {
    const currentUserId = (req as any).cookies?.sessionId 
      ? await this.productionTypesService.getUserIdBySession(req.cookies.sessionId) 
      : null;
    return this.productionTypesService.find_all_published(filters, currentUserId);
  }

  @Get('feed/:id')
  async getFeedItem(
    @Param('id', ParseIntPipe) id: number,
    @Query('next', new DefaultValuePipe(false), ParseBoolPipe) next?: boolean,
    @Req() req?: Request,
  ) {
    const currentUserId = req?.cookies?.sessionId 
      ? await this.productionTypesService.getUserIdBySession(req.cookies.sessionId) 
      : null;
    return this.productionTypesService.find_feed_item(id, next, currentUserId);
  }

  @Get('draft')
  @UseGuards(SessionGuard)
  async getDraft(@Req() req: Request & { user: { id: number } }) {
    return this.productionTypesService.find_draft(req.user.id);
  }

  @Post()
  @UseGuards(SessionGuard)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]))
  async createService(
    @Body() dto: CreateProductionDto,
    @UploadedFiles() files: { image?: Express.Multer.File[]; video?: Express.Multer.File[] },
    @Req() req: Request & { user: { id: number } },
  ) {
    const image = files?.image ? files.image[0] : undefined;
    const video = files?.video ? files.video[0] : undefined;
    return this.productionTypesService.create_draft(dto, req.user.id, image, video);
  }

  @Put(':id/publish')
  @UseGuards(SessionGuard)
  async publishService(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductionDto,
    @Req() req: Request & { user: { id: number } },
  ) {
    return this.productionTypesService.publish_draft(id, req.user.id, dto);
  }

  @Delete(':id')
  @UseGuards(SessionGuard)
  @HttpCode(204)
  async deleteService(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: { id: number } },
  ): Promise<void> {
    await this.productionTypesService.softDeleteBySql(id, req.user.id);
  }

  @Post(':id/like')
  @UseGuards(SessionGuard)
  @HttpCode(204)
  async handleLike(
    @Param('id', ParseIntPipe) id: number,
    @Body() likeDto: LikeDto,
    @Req() req: Request & { user: { id: number } },
  ): Promise<void> {
    await this.productionTypesService.handleLike(id, req.user.id, likeDto.action);
  }
}