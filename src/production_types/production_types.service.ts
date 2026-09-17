import { Injectable } from '@nestjs/common';
import { ProductionTypes } from './production_types.model.js';

@Injectable()
export class ProductionTypesService {
  private readonly production_types_list: ProductionTypes[] = [
    {
      production_id: 1,
      craft_title: 'Гончарное производство',
      description: 'Гончарное производство - одно из древнейших ремёсел, освоенное человеком ещё в эпоху неолита. Глина формуется на ручном или ножном гончарном круге, затем обжигается в печи при температуре до 1000 °C. Изделия покрываются глазурью или ангобом, что придаёт им водонепроницаемость и декоративный вид. Каждый этап требует точного соблюдения влажности и времени сушки.',
      production_output_rate: 150,
      defect_waste_quantity: 18,
      status: 'published',
      image_key: 'pottery.jpg',
      video_key: 'pottery_video.mp4',
      user_liked_ids: [10, 15, 20],
    },
    {
      production_id: 2,
      craft_title: 'Металлургия',
      description: 'Металлургия - ремесло обработки руды и металла, определившее развитие целых эпох. Мастера осваивали плавку в сыродутных горнах, ковку, литьё и чеканку. Из железа, меди, бронзы и серебра изготовляли орудия труда, оружие, украшения и монеты. Температура плавления, состав сплава и скорость охлаждения напрямую влияли на прочность и качество готовых изделий.',
      production_output_rate: 40,
      defect_waste_quantity: 65,
      status: 'published',
      image_key: 'metallurgy.jpg',
      video_key: 'metallurgy_video.mp4',
      user_liked_ids: [10, 33],
    },
    {
      production_id: 3,
      craft_title: 'Кожевенное дело',
      description: 'Кожевенное дело - обработка шкур животных для получения мягкой, прочной и долговечной кожи. Шкуры вымачивают, золят, дубят растительными или минеральными веществами, затем размягчают и окрашивают. Из готовой кожи шили обувь, сумки, ремни, доспехи и конскую упряжь. Опытный кожевник различал десятки сортов кожи и знал, какая подходит для каждого изделия.',
      production_output_rate: 85,
      defect_waste_quantity: 12,
      status: 'published',
      image_key: 'leather.jpg',
      video_key: 'leather_video.mp4',
      user_liked_ids: [10, 15, 45, 99],
    },
    {
      production_id: 4,
      craft_title: 'Деревообработка',
      description: 'Деревообработка - ремесло изготовления предметов из древесины. Мастера использовали топор, тесло, рубанок и пилу. Древесину сушили и обрабатывали воском или смолой. Из дерева строили дома, мебель, посуду и многое другое.',
      production_output_rate: 60,
      defect_waste_quantity: 30,
      status: 'draft',
      image_key: 'woodworking.jpg',
      video_key: 'woodworking_video.mp4',
      user_liked_ids: [],
    },
    {
      production_id: 5,
      craft_title: 'Ткачество',
      description: 'Ткачество - производство ткани из пряжи на ткацком станке. Волокна льна, шерсти, хлопка или шёлка скручивались в нити, которые затем переплетались в продольном и поперечном направлениях. Плотность ткани, узор и качество зависели от сорта волокна и мастерства ткача. Из готового полотна шили одежду, постельные принадлежности, паруса и мешки.',
      production_output_rate: 20,
      defect_waste_quantity: 80,
      status: 'deleted',
      image_key: 'weaving.jpg',
      video_key: 'weaving_video.mp4',
      user_liked_ids: [],
    },
  ];

  private get_visible(): ProductionTypes[] {
    return this.production_types_list.filter((item) => item.status !== 'deleted');
  }

  find_all_published(min_rate?: number, max_rate?: number) {
    let effective_min = min_rate;
    let effective_max = max_rate;

    // Если минимальная норма больше максимальной, меняем их местами, чтобы фильтр не ломался
    if (effective_min !== undefined && effective_max !== undefined && effective_min > effective_max) {
      const temp = effective_min;
      effective_min = effective_max;
      effective_max = temp;
    }

    return this.get_visible()
      .filter((item) => item.status === 'published')
      .filter((item) => {
        const meets_min = effective_min !== undefined ? item.production_output_rate >= effective_min : true;
        const meets_max = effective_max !== undefined ? item.production_output_rate <= effective_max : true;
        return meets_min && meets_max;
      });
  }

  find_draft(): ProductionTypes | undefined {
    return this.production_types_list.find((item) => item.status === 'draft');
  }

  find_feed_item(id?: number, next?: boolean): ProductionTypes | undefined {
    const list = this.get_visible().filter((item) => item.status === 'published');
    if (!id) return list[0];

    const index = list.findIndex((item) => item.production_id === id);
    if (index === -1) return list[0];

    if (next) {
      return list[index + 1] ?? list[0];
    }
    return list[index];
  }

  count_likes(item: ProductionTypes): number {
    return item.user_liked_ids.length;
  }
}