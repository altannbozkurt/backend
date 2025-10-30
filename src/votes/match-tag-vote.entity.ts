// src/votes/match-tag-vote.entity.ts

import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Match } from '../matches/match.entity';
import { User } from '../users/user.entity';

@Entity('match_tag_votes')
export class MatchTagVote {

  // --- Kompozit Birincil Anahtar (Bölüm 1) ---
  @PrimaryColumn('uuid')
  @ManyToOne(() => Match, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match_id: string;

  // --- Kompozit Birincil Anahtar (Bölüm 2) ---
  @PrimaryColumn('uuid')
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'voter_user_id' }) // Oyu veren
  voter_user_id: string;

  // --- Etiketlenen Kişi ---
  @Column('uuid')
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tagged_user_id' }) // Etiketi alan
  tagged_user_id: string;

  // Verilen etiketin kimliği (Örn: 'FINISHING', 'DEFENDING')
  @Column({ type: 'text' })
  tag_id: string;

  @CreateDateColumn()
  created_at: Date;
}