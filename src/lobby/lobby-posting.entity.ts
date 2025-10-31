import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Field } from '../fields/field.entity';
import { LobbyResponse } from './lobby-response.entity';

// SQL'de oluşturduğumuz ENUM tipleri
export type LobbyPostType = 'PLAYER_WANTED' | 'OPPONENT_WANTED';
export type LobbyPostStatus = 'open' | 'filled' | 'expired';

@Entity('lobby_postings')
export class LobbyPosting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  creator_user_id: string;

  @ManyToOne(() => User, { eager: true }) // eager: true -> ilanı çekerken yaratıcıyı da getir
  @JoinColumn({ name: 'creator_user_id' })
  creator: User;

  @Column({
    type: 'enum',
    enum: ['PLAYER_WANTED', 'OPPONENT_WANTED'],
  })
  type: LobbyPostType;

  @Column({
    type: 'enum',
    enum: ['open', 'filled', 'expired'],
    default: 'open',
  })
  status: LobbyPostStatus;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  field_id: string;

  @ManyToOne(() => Field, { eager: true, nullable: true }) // Sahayı da otomatik getir
  @JoinColumn({ name: 'field_id' })
  field: Field;

  @Column({ type: 'timestamptz' }) // Zaman dilimiyle birlikte
  match_time: Date;

  @Column({ type: 'int' })
  team_size: number; // örn: 7 (7v7)

  @Column({ type: 'int', nullable: true })
  players_needed: number; // örn: 1 (1 oyuncu aranıyor)

  @Column({ nullable: true })
  position_needed: string; // örn: 'goalkeeper'

  @CreateDateColumn()
  created_at: Date;

  // İlişki: Bir ilanın çok başvurusu olabilir
  @OneToMany(() => LobbyResponse, (response) => response.post)
  responses: LobbyResponse[];
}