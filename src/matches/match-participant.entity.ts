// src/matches/match-participant.entity.ts
// (veya src/match-participants/match-participant.entity.ts)

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Match } from './match.entity';

// SQL'de tasarladığımız ENUM
export type ParticipantStatus =
  | 'invited'
  | 'requested'
  | 'accepted'
  | 'declined';

@Entity('match_participants')
// @Unique: Bir kullanıcının bir maça sadece bir kez kaydolabilmesini sağlar
@Unique(['match_id', 'user_id']) 
export class MatchParticipant {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  // --- Maç İlişkisi (Many-to-One) ---
  @ManyToOne(() => Match, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column({ type: 'uuid' })
  match_id: string;

  // --- Kullanıcı İlişkisi (Many-to-One) ---
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid' })
  user_id: string;

  // --- Katılım Detayları ---

  @Column({
    type: 'enum',
    enum: ['invited', 'requested', 'accepted', 'declined'],
    nullable: false,
  })
  status: ParticipantStatus;

  // Taktiksel başvuru için (Örn: 'defans', 'forvet')
  @Column({ type: 'text', nullable: true })
  position_request: string; 

  // Kaptan tarafından doldurulacak OYNANMA KANITI
  // Maç bitene kadar NULL. Kaptan onaylayınca true/false olur.
  // Bu, güvenilirlik puanlarını hesaplamak için hayati önem taşır.
  @Column({ type: 'boolean', nullable: true })
  attended: boolean; 

  @CreateDateColumn()
  joined_at: Date;
}