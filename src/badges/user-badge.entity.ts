import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Badge } from './badge.entity';

@Entity('user_badges') // "Join Table" - Hangi kullanıcı hangi rozeti kazandı
@Index(['user_id', 'badge_id'], { unique: true }) // Bir kullanıcı bir rozeti sadece bir kez kazanabilir
export class UserBadge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar', length: 50 })
  badge_id: string;

  @CreateDateColumn()
  earned_at: Date; // Kazanılma tarihi

  // İlişkinin User tarafı
  @ManyToOne(() => User, (user) => user.userBadges, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // İlişkinin Badge tarafı
  @ManyToOne(() => Badge, (badge) => badge.userBadges, {
    eager: true, // UserBadge çekildiğinde, Badge detaylarını otomatik olarak getir
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'badge_id' })
  badge: Badge;
}
