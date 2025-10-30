// src/users/user.entity.ts

import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  OneToOne,
  OneToMany
} from 'typeorm';
import { PlayerProfile } from '../player-profiles/player-profile.entity'; // <-- EKLE
import { UserBadge } from '../badges/user-badge.entity'; // <-- EKLE

// @Entity('users') işareti, bu sınıfın veritabanındaki 'users' tablosuna
// karşılık geldiğini TypeORM'ye söyler.
@Entity('users')
export class User {

  // @PrimaryGeneratedColumn('uuid') işareti, bunun birincil anahtar (PRIMARY KEY)
  // olduğunu ve 'uuid' formatında otomatik oluşturulacağını söyler.
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // @Column(...) işareti, bunun bir sütun olduğunu söyler.
  @Column({ type: 'text', unique: true, nullable: false })
  phone_number: string;

  @Column({ type: 'text', nullable: false })
  full_name: string;

  @Column({ type: 'date', nullable: true }) // Başlangıçta null olabilir
  birth_date: Date;

  @Column({ type: 'text', nullable: true })
  city: string;

  @Column({ type: 'text', nullable: true }) // district: string; SATIRINI BUNUNLA DEĞİŞTİR
  state: string; // Eyalet (Örn: 'PA', 'CA')

  @Column({ type: 'text', nullable: true }) // YENİ EKLE
  zip_code: string; // Posta Kodu (Örn: '15213')
  
  @Column({ type: 'text', nullable: true })
  profile_image_url: string;

  // --- İLİŞKİYİ EKLE ---
  @OneToOne(() => PlayerProfile, (profile) => profile.user)
  playerProfile: PlayerProfile; // 'participants.user.playerProfile' sorgusu için bu gerekli
  // --- BİTTİ ---

  // @CreateDateColumn işareti, bu kaydın oluşturulma tarihini
  // otomatik olarak veritabanına ekler.
  @CreateDateColumn()
  created_at: Date;

  // --- İLİŞKİYİ EKLE ---
  @OneToMany(() => UserBadge, (userBadge) => userBadge.user)
  userBadges: UserBadge[];
  // --- BİTTİ ---
}