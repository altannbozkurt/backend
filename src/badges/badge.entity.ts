import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { UserBadge } from './user-badge.entity';

@Entity('badges') // Veritabanındaki 'badges' tablosu
export class Badge {
  // Rozet ID'si (örn: 'MVP_BRONZE', 'GOLD_WALL')
  // Bunu manuel olarak biz belirleyeceğiz
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string; // Örn: 'Bronz MVP'

  @Column({ type: 'text' })
  description: string; // Örn: '10 maçta MVP seçildin'

  @Column({ type: 'varchar', length: 50 })
  tier: string; // Örn: 'bronze', 'silver', 'gold'

  @Column({ type: 'text', nullable: true })
  icon_url: string; // Rozet görselinin URL'si

  // Bir rozetin birçok kullanıcı tarafından kazanılabileceği ilişki
  @OneToMany(() => UserBadge, (userBadge) => userBadge.badge)
  userBadges: UserBadge[];
}