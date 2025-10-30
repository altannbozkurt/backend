// src/matches/match.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Field } from '../fields/field.entity';
import { MatchParticipant } from './match-participant.entity';

// SQL'de tasarladığımız ENUM'ları TypeScript tipi olarak tanımlıyoruz
export type MatchPrivacy = 'public' | 'private';
export type MatchJoinType = 'open' | 'approval_required';
export type MatchStatus = 'scheduled' | 'completed' | 'cancelled';

@Entity('matches')
export class Match {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  // --- Organizatör İlişkisi (Many-to-One) ---
  // @ManyToOne: Birçok maç bir kullanıcıya (organizatöre) aittir.
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'organizer_id' }) // Veritabanındaki sütun adı
  organizer: User;

  @Column({ type: 'uuid' }) // İlişkiyi tutmak için sadece ID'yi de ekliyoruz
  organizer_id: string;

  // --- Saha İlişkisi (Many-to-One) ---
  // @ManyToOne: Birçok maç bir sahada oynanabilir.
  @ManyToOne(() => Field, { nullable: false })
  @JoinColumn({ name: 'field_id' })
  field: Field;

  @Column({ type: 'uuid' })
  field_id: string;

  // --- Maç Detayları ---

  @Column({ type: 'timestamptz' }) // 'timestamptz' saat dilimlerini de saklar, bu çok önemli
  start_time: Date;

  @Column({ type: 'integer', default: 60 })
  duration_minutes: number;

  @Column({ type: 'text', nullable: false }) // Örn: '7v7', '6v6'
  format: string;

  @Column({
    type: 'enum',
    enum: ['public', 'private'],
    default: 'public',
  })
  privacy_type: MatchPrivacy;

  @Column({
    type: 'enum',
    enum: ['open', 'approval_required'],
    default: 'open',
  })
  join_type: MatchJoinType;

  @Column({
    type: 'enum',
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled',
  })
  status: MatchStatus;

  @Column({ type: 'text', nullable: true })
  notes: string; // Kaptan notları

  // --- İLİŞKİNİN TERS TARAFINI BURAYA EKLE ---
  @OneToMany(() => MatchParticipant, (participant) => participant.match)
  participants: MatchParticipant[];
  // --- DÜZELTME BİTTİ ---

  @CreateDateColumn()
  created_at: Date;
}