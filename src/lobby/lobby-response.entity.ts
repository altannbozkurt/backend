import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { LobbyPosting } from './lobby-posting.entity';

// SQL'de oluşturduğumuz ENUM
export type LobbyResponseStatus = 'pending' | 'accepted' | 'rejected';

@Entity('lobby_responses')
export class LobbyResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  post_id: string;

  @ManyToOne(() => LobbyPosting, (post) => post.responses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'post_id' })
  post: LobbyPosting;

  @Column({ type: 'uuid' })
  responder_user_id: string;

  @ManyToOne(() => User, { eager: true }) // Başvuranı da otomatik getir
  @JoinColumn({ name: 'responder_user_id' })
  responder: User;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  })
  status: LobbyResponseStatus;

  @CreateDateColumn()
  created_at: Date;
}