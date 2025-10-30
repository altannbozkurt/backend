// src/votes/match-mvp-vote.entity.ts

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

@Entity('match_mvp_votes')
export class MatchMvpVote {
  
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

  // --- Oylanan Kişi ---
  // Burası sadece bir sütun, birincil anahtar değil
  @Column('uuid') 
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'voted_user_id' }) // Oyu alan
  voted_user_id: string;

  @CreateDateColumn()
  created_at: Date;
}