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
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ProductionTypesService } from './production_types.service.js';
import { ProductionFiltersDto } from './dto/production-filters.dto.js';
import { CreateProductionDto } from './dto/create-production.dto.js';
import { UpdateProductionDto } from './dto/update-production.dto.js';
import { LikeDto } from './dto/like.dto.js';
import 'multer';

@Controller('production_types')
export class ProductionTypesController {
  constructor(private readonly productionTypesService: ProductionTypesService) {}

  @Get()
  async getList(@Query() filters: ProductionFiltersDto) {
    return this.productionTypesService.find_all_published(filters);
  }

  @Get('feed/:id')
  async getFeedItem(
    @Param('id', ParseIntPipe) id: number,
    @Query('next', new DefaultValuePipe(false), ParseBoolPipe) next?: boolean,
  ) {
    return this.productionTypesService.find_feed_item(id, next);
  }

  @Get('draft')
  async getDraft() {
    return this.productionTypesService.find_draft();
  }

  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]))
  async createService(
    @Body() dto: CreateProductionDto,
    @UploadedFiles() files: { image?: Express.Multer.File[]; video?: Express.Multer.File[] },
  ) {
    const image = files?.image ? files.image[0] : undefined;
    const video = files?.video ? files.video[0] : undefined;
    return this.productionTypesService.create_draft(dto, image, video);
  }

  @Put(':id/publish')
  async publishService(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductionDto,
  ) {
    return this.productionTypesService.publish_draft(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteService(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.productionTypesService.softDeleteBySql(id);
  }

  @Post(':id/like')
  @HttpCode(204)
  async handleLike(
    @Param('id', ParseIntPipe) id: number,
    @Body() likeDto: LikeDto,
  ): Promise<void> {
    await this.productionTypesService.handleLike(id, likeDto.action);
  }
}