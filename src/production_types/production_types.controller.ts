import {
  Controller,
  Get,
  Param,
  Query,
  Render,
  Res,
  Post,
  Body,
  Redirect,
  ParseIntPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { ProductionTypesService } from './production_types.service.js';

@Controller('production_types')
export class ProductionTypesController {
  constructor(private readonly production_types_service: ProductionTypesService) {}

  // 1. ПЛИТКА: GET /production_types
  @Get()
  @Render('production_types_tile')
  async render_tile(@Query() query: { min_rate?: string; max_rate?: string }) {
    const bounds = await this.production_types_service.get_rate_bounds(); // Границы диапазона берём из БД (только published)
    let activeMin = // Что выбрал пользователь. Если пусто — берём весь диапазон
      query.min_rate && query.min_rate !== '' ? Number(query.min_rate) : bounds.min;
    let activeMax =
      query.max_rate && query.max_rate !== '' ? Number(query.max_rate) : bounds.max;
    if (activeMin > activeMax) { // Защита от некорректного порядка
      const temp = activeMin;
      activeMin = activeMax;
      activeMax = temp;
    }
    activeMin = Math.max(bounds.min, Math.min(bounds.max, activeMin));
    activeMax = Math.max(bounds.min, Math.min(bounds.max, activeMax));
    const productions = await this.production_types_service.find_all_published(
      activeMin,
      activeMax,
    );
    const step = (bounds.max - bounds.min) / 10; // 11 подписей на шкале: slider_min, 9 промежуточных, slider_max. Промежуточные считаются равными долями от (slider_max - slider_min) / 10
    const scale: number[] = [];
    for (let i = 1; i <= 9; i++) { 
      scale.push(Math.round(bounds.min + step * i));
    }
    return {
      title: 'Типы производств',
      min_rate: activeMin,
      max_rate: activeMax,
      slider_min: bounds.min,
      slider_max: bounds.max,
      scale,
      productions,
    };
  }

  // 2. ДОБАВЛЕНИЕ (ЧЕРНОВИК): GET /production_types/draft
  @Get('draft')
  @Render('production_types_add')
  async render_draft() {
    const draft = await this.production_types_service.find_draft();
    return {
      title: 'Черновик типа производства',
      draft: draft || {},
      hasDraft: !!draft,
    };
  }

  // 3. ЛЕНТА: GET /production_types/feed (первый элемент)
  @Get('feed')
  async render_feed_first(@Res() res: Response) {
    const item = await this.production_types_service.find_feed_item(undefined, false);
    return res.render('production_types_feed', {
      title: item ? item.craft_title : 'Не найдено',
      item,
      likes_count: item ? item.likes_count : 0,
    });
  }

  // 4. ЛЕНТА: GET /production_types/feed/:id
  @Get('feed/:id')
  async render_feed_with_id(
    @Param('id') id: string,
    @Query('next') next: string,
    @Res() res: Response,
  ) {
    const parsed_id = Number(id);
    const is_next = next === 'true';
    const item = await this.production_types_service.find_feed_item(parsed_id, is_next);
    if (!item) { // Если элемент не найден (например, id удален и нет next), или если запрашивали конкретный id, а он удален/не существует — редиректим на первую карточку
      return res.redirect('/production_types/feed');
    }
    if (is_next) {
      return res.redirect(`/production_types/feed/${item.production_id}`);
    }
    if (!is_next && item.production_id !== parsed_id) { // редерикт
      return res.redirect(`/production_types/feed/${item.production_id}`);
    }
    return res.render('production_types_feed', {
      title: item.craft_title,
      item,
      likes_count: item.likes_count,
    });
  }

  // 5. СОЗДАНИЕ ЧЕРНОВИКА (кнопка «Далее»): POST /production_types/draft/next
  @Post('draft/next')
  @Redirect('/production_types/draft', 302)
  async create_draft(
    @Body() body: { craft_title?: string; image_key?: string; video_key?: string },
  ) {
    await this.production_types_service.create_draft({
      craft_title: body.craft_title,
      image_key: body.image_key,
      video_key: body.video_key,
    });
  }

  // 6. ПУБЛИКАЦИЯ ЧЕРНОВИКА (кнопка «Опубликовать»): POST /production_types/draft/publish
    // 6. ПУБЛИКАЦИЯ ЧЕРНОВИКА (кнопка «Опубликовать»): POST /production_types/draft/publish
  @Post('draft/publish')
  @Redirect('/production_types', 302)
  async publish_draft(
    @Body()
    body: {
      craft_title: string;
      description: string;
      production_output_rate: string;
      defect_waste_quantity: string;
    },
  ) {
    await this.production_types_service.publish_draft({
      craft_title: body.craft_title,
      description: body.description,
      production_output_rate: body.production_output_rate,
      defect_waste_quantity: body.defect_waste_quantity,
    });
  }

  // 7. УДАЛЕНИЕ УСЛУГИ ЧЕРЕЗ SQL UPDATE по требованиям лабораторной №2
  @Post('delete/:id')
  @Redirect('/production_types', 302)
  async delete_production(@Param('id', ParseIntPipe) id: number) {
    await this.production_types_service.softDeleteBySql(id);
  }
}