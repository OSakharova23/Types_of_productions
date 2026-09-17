import { Controller, Get, Param, Query, Render, Res } from '@nestjs/common';
import type { Response, Request } from 'express';
import { ProductionTypesService } from './production_types.service.js';
import { ProductionTypes } from './production_types.model.js';

@Controller('production_types')
export class ProductionTypesController {
  constructor(private readonly production_types_service: ProductionTypesService) {}

  // 1. ПЛИТКА: GET /production_types
  @Get()
  @Render('production_types_tile')
  render_tile(@Query() query: { min_rate?: string; max_rate?: string }) {
    let activeMin = query.min_rate && query.min_rate !== '' ? query.min_rate : '0';
    let activeMax = query.max_rate && query.max_rate !== '' ? query.max_rate : '200';

    let parsed_min = Number(activeMin);
    let parsed_max = Number(activeMax);

    // Если левое значение больше правого, меняем их местами и для отображения тоже!
    if (parsed_min > parsed_max) {
      const temp = parsed_min;
      parsed_min = parsed_max;
      parsed_max = temp;

      activeMin = String(parsed_min);
      activeMax = String(parsed_max);
    }
    
    const list = this.production_types_service.find_all_published(parsed_min, parsed_max);

    const items_with_likes = list.map((item: ProductionTypes) => ({
      ...item,
      likes_count: this.production_types_service.count_likes(item),
    }));

    return {
      title: 'Типы производств',
      min_rate: activeMin,
      max_rate: activeMax,
      productions: items_with_likes,
    };
  }

  // 2. ДОБАВЛЕНИЕ (ЧЕРНОВИК): GET /production_types/draft
  @Get('draft')
  @Render('production_types_add')
  render_draft() {
    const draft = this.production_types_service.find_draft();
    return {
      title: 'Черновик типа производства',
      draft,
    };
  }

  // 3. ЛЕНТА: GET /production_types/feed (первый элемент)
  @Get('feed')
  render_feed_first(@Res() res: Response) {
    const item = this.production_types_service.find_feed_item(undefined, false);
    return res.render('production_types_feed', {
      title: item ? item.craft_title : 'Не найдено',
      item,
      likes_count: item ? this.production_types_service.count_likes(item) : 0,
    });
  }

  // 4. ЛЕНТА: GET /production_types/feed/:id
  @Get('feed/:id')
  render_feed_with_id(
    @Param('id') id: string,
    @Query('next') next: string,
    @Res() res: Response,
  ) {
    const parsed_id = Number(id);
    const is_next = next === 'true';
    const item = this.production_types_service.find_feed_item(parsed_id, is_next);

    if (is_next && item) {
      return res.redirect(`/production_types/feed/${item.production_id}`);
    }

    return res.render('production_types_feed', {
      title: item ? item.craft_title : 'Не найдено',
      item,
      likes_count: item ? this.production_types_service.count_likes(item) : 0,
    });
  }
}