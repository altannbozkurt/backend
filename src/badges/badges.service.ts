import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserBadge } from './user-badge.entity';
import { Badge } from './badge.entity'; // Opsiyonel, sadece kontrol için

@Injectable()
export class BadgesService {
  private readonly logger = new Logger(BadgesService.name);

  constructor(
    @InjectRepository(UserBadge)
    private userBadgeRepository: Repository<UserBadge>,
    @InjectRepository(Badge) // Opsiyonel: Rozetin var olup olmadığını kontrol etmek için
    private badgeRepository: Repository<Badge>,
  ) {}

  /**
   * Bir kullanıcıya, eğer zaten sahip değilse, bir rozet verir.
   * @param userId Kullanıcı ID'si
   * @param badgeId Verilecek rozetin ID'si (örn: 'FIRST_MATCH')
   */
  async awardBadge(userId: string, badgeId: string): Promise<void> {
    try {
      // 1. Kullanıcı bu rozete zaten sahip mi?
      const existingBadge = await this.userBadgeRepository.findOne({
        where: { user_id: userId, badge_id: badgeId },
      });

      // 2. Eğer zaten sahipse, hiçbir şey yapma
      if (existingBadge) {
        // this.logger.log(`User ${userId} already has badge ${badgeId}.`);
        return;
      }

      // Opsiyonel: Rozet ID'si 'badges' tablosunda var mı diye kontrol et
      const badgeExists = await this.badgeRepository.findOneBy({ id: badgeId });
      if (!badgeExists) {
         this.logger.warn(`Attempted to award non-existent badge: ${badgeId}`);
         return;
      }

      // 3. Rozeti oluştur ve kaydet
      this.logger.log(`Awarding badge ${badgeId} to user ${userId}...`);
      const newUserBadge = this.userBadgeRepository.create({
        user_id: userId,
        badge_id: badgeId,
      });
      await this.userBadgeRepository.save(newUserBadge);

    } catch (error) {
      // (örn: unique constraint hatası - nadir)
      this.logger.error(
        `Failed to award badge ${badgeId} to user ${userId}`,
        error.stack,
      );
    }
  }

  // TODO: İleride "MVP sayısına göre rozet ver" gibi daha karmaşık
  // 'checkAndAwardMvpBadges(userId)' fonksiyonları buraya eklenebilir.
}
