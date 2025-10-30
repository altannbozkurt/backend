// src/fields/fields.service.ts

import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Field } from './field.entity';
import { Repository } from 'typeorm';
import { CreateFieldDto } from './dto/create-field.dto';
import { User } from '../users/user.entity'; // Kaptanın kim olduğunu bilmek için

@Injectable()
export class FieldsService {
  constructor(
    @InjectRepository(Field)
    private fieldRepository: Repository<Field>,
  ) {}

  /**
   * Veritabanına yeni bir halı saha oluşturur.
   * DTO'dan gelen enlem/boylamı GeoJSON formatına çevirir.
   */
  /**
   * YENİ GÜNCELLENMİŞ FONKSİYON:
   * Yeni bir halı saha oluşturur.
   * DUPLICATE (KOPYA) KONTROLÜ EKLENDİ.
   */
  async createField(createFieldDto: CreateFieldDto): Promise<Field> {
    
    const { name, address, location, has_showers, is_indoor } = createFieldDto;

    // PostGIS formatına çevir
    const locationGeoJSON = {
      type: 'Point',
      coordinates: [location.longitude, location.latitude],
    };
    
    // 1. YENİ KONTROL: Bu konuma (100m) çok yakın VEYA bu isimde bir saha var mı?
    const existingField = await this.fieldRepository
      .createQueryBuilder('field')
      .where('field.name = :name', { name })
      .orWhere(
        `ST_DWithin(
          field.location, 
          ST_MakePoint(:longitude, :latitude)::geography, 
          100 
        )`, // 100 metrelik yarıçap içinde
        { longitude: location.longitude, latitude: location.latitude },
      )
      .getOne(); // Bir tane bile bulsa yeterli

    if (existingField) {
      throw new ConflictException(
        'Bu isimde veya bu konuma (100m) çok yakın başka bir saha zaten kayıtlı.'
      );
    }
    // --- KONTROL BİTTİ ---

    // 2. Yeni sahayı oluştur (Eski kod)
    const newField = this.fieldRepository.create({
      name,
      address,
      location: locationGeoJSON,
      has_showers,
      is_indoor,
    });

    return await this.fieldRepository.save(newField);
  }

  /**
   * Verilen bir koordinata, belirtilen metre (radius) 
   * yakınındaki tüm sahaları bulur.
   */
  async findNearbyFields(
    latitude: number,
    longitude: number,
    radiusInMeters: number = 20000, // Varsayılan 20km
  ): Promise<Field[]> {
    
    // PostGIS'in gücünü burada kullanıyoruz.
    // TypeORM'in "QueryBuilder"ı ile özel bir sorgu yazıyoruz.
    return this.fieldRepository
      .createQueryBuilder('field')
      .where(
        `
        ST_DWithin(
          field.location, 
          ST_MakePoint(:longitude, :latitude)::geography, 
          :radius
        )
        `,
        {
          longitude, // :longitude değişkenine ata
          latitude,  // :latitude değişkenine ata
          radius: radiusInMeters, // :radius değişkenine ata
        },
      )
      .getMany(); // Bulunan tüm sonuçları getir
  }
}