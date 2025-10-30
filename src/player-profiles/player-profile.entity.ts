// src/player-profiles/player-profile.entity.ts

import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity'; // User entity'mizi import ediyoruz

// SQL'de 'card_level' enum'ı olarak tasarlamıştık.
// TypeScript'te bunu bir 'type' olarak tanımlayabiliriz.
export type CardLevel = 'bronze' | 'silver' | 'gold';

@Entity('player_profiles')
export class PlayerProfile {

  // Birebir ilişkide, user_id'nin kendisi
  // hem Birincil Anahtar (Primary Key) hem de Yabancı Anahtardır (Foreign Key).
  @PrimaryColumn('uuid')
  user_id: string;

  // @OneToOne ile User'a bağlıyoruz
  // @JoinColumn ile bu ilişkinin 'user_id' sütunu üzerinden
  // yönetileceğini söylüyoruz.
  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // --- Oyuncu Kartı İstatistikleri ---

  @Column({
    type: 'enum',
    enum: ['bronze', 'silver', 'gold'],
    default: 'bronze',
  })
  card_type: CardLevel;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 60 })
  overall_rating: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 60 })
  stat_pac: number; // Hız

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 60 })
  stat_sho: number; // Şut

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 60 })
  stat_pas: number; // Pas

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 60 })
  stat_dri: number; // Dribling

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 60 })
  stat_def: number; // Defans

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 60 })
  stat_phy: number; // Fizik

  @Column({ type: 'text', nullable: true })
  preferred_foot: 'right' | 'left' | 'both';

  @Column({ type: 'text', nullable: true })
  preferred_position: 'forward' | 'midfielder' | 'defender' | 'goalkeeper';

  // --- Güvenilirlik ve İtibar ---

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 100 })
  fair_play_score: number;

  // SQL'deki NUMERIC(5, 2) için TypeORM'de bu ayarları kullanırız.
  @Column({ type: 'numeric', precision: 5, scale: 2, default: 100.00 })
  participation_rate: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0.00 })
  cancellation_rate: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0.00 })
  no_show_rate: number;

  // Bu profil her güncellendiğinde tarihi otomatik olarak kaydeder.
  @UpdateDateColumn()
  updated_at: Date;
}