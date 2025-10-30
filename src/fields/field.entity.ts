// src/fields/field.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('fields')
export class Field {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  // --- POSTGIS ENTEGRASYONU BAŞLIYOR ---

  // @Index({ spatial: true }) işareti, TypeORM'ye bu sütun üzerinde
  // bir "spatial index" (coğrafi dizin) oluşturmasını söyler.
  // Bu, "10km çevremdeki sahaları getir" gibi sorguları 
  // IŞIK HIZINDA yapabilmemizi sağlar. Bu satır KRİTİKTİR.
  @Index({ spatial: true })
  @Column({
    type: 'geography', // Veritabanı tipi
    spatialFeatureType: 'Point', // Saklayacağımız veri tipi (Nokta)
    srid: 4326, // Coğrafi koordinat sistemi (Standart GPS enlem/boylamı)
    nullable: false,
  })
  // Bu sütuna veri eklerken GeoJSON formatında bir "Point" objesi 
  // göndereceğiz. Örn: { type: 'Point', coordinates: [BOYLAM, ENLEM] }
  // Örn: { type: 'Point', coordinates: [29.0246, 41.0435] }
  location: any;

  // --- POSTGIS ENTEGRASYONU BİTTİ ---

  @Column({ type: 'boolean', default: false })
  has_showers: boolean;

  @Column({ type: 'boolean', default: false })
  is_indoor: boolean;

  @Column({ type: 'numeric', precision: 3, scale: 1, default: 0.0 })
  community_rating: number; // 5.0 üzerinden

  @CreateDateColumn()
  created_at: Date;
}