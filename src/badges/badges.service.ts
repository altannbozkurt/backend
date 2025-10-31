import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserBadge } from './user-badge.entity';
import { Badge } from './badge.entity'; // Opsiyonel, sadece kontrol için
import { PlayerProfile } from '../player-profiles/player-profile.entity'; // YENİ İMPORT

// YENİ ROZET ID'LERİ (SABİTLER)
// (Veritabanına Adım 1'de eklediklerimizle aynı olmalı)

// Maç Rozetleri
const BADGE_MATCHES_5 = 'MATCHES_5';
const BADGE_MATCHES_10 = 'MATCHES_10';
const BADGE_MATCHES_25 = 'MATCHES_25';
const BADGE_MATCHES_50 = 'MATCHES_50';
const BADGE_MATCHES_100 = 'MATCHES_100';
// ... 250, 500, 1000 ...

// MVP Rozetleri
const BADGE_MVP_10 = 'MVP_10'; // 'MVP_BRONZE' yerine bunu kullanabiliriz
const BADGE_MVP_25 = 'MVP_25';
const BADGE_MVP_50 = 'MVP_50';

// Etiket Rozetleri
const BADGE_TAGS_5 = 'TAGS_5';
const BADGE_TAGS_10 = 'TAGS_10';
const BADGE_TAGS_25 = 'TAGS_25';
const BADGE_TAGS_50 = 'TAGS_50';
const BADGE_TAGS_100 = 'TAGS_100';

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

  /**
   * YENİ FONKSİYON: Kümülatif istatistiklere (toplam maç, mvp, etiket)
   * göre rozetleri kontrol eder ve verir.
   * Bu fonksiyon tasks.service tarafından, profil güncellendikten sonra çağrılır.
   */
  async checkAndAwardCumulativeBadges(
    userId: string,
    profile: PlayerProfile,
  ): Promise<void> {
    try {
      // 1. Toplam Maç Rozetleri
      // (NOT: 'FIRST_MATCH' tasks.service'te verildi, burada tekrar gerek yok)
      if (profile.total_matches_played >= 5) await this.awardBadge(userId, BADGE_MATCHES_5);
      if (profile.total_matches_played >= 10) await this.awardBadge(userId, BADGE_MATCHES_10);
      if (profile.total_matches_played >= 25) await this.awardBadge(userId, BADGE_MATCHES_25);
      if (profile.total_matches_played >= 50) await this.awardBadge(userId, BADGE_MATCHES_50);
      if (profile.total_matches_played >= 100) await this.awardBadge(userId, BADGE_MATCHES_100);
      // ... (250, 500, 1000 için eklenebilir)

      // 2. Toplam MVP Rozetleri
      // (Eski 'MVP_BRONZE' yerine 10 MVP'de 'MVP_10' veriyoruz)
      if (profile.total_mvps_won >= 10) await this.awardBadge(userId, BADGE_MVP_10);
      if (profile.total_mvps_won >= 25) await this.awardBadge(userId, BADGE_MVP_25);
      if (profile.total_mvps_won >= 50) await this.awardBadge(userId, BADGE_MVP_50);

      // 3. Toplam Etiket Rozetleri
      if (profile.total_tags_received >= 5) await this.awardBadge(userId, BADGE_TAGS_5);
      if (profile.total_tags_received >= 10) await this.awardBadge(userId, BADGE_TAGS_10);
      if (profile.total_tags_received >= 25) await this.awardBadge(userId, BADGE_TAGS_25);
      if (profile.total_tags_received >= 50) await this.awardBadge(userId, BADGE_TAGS_50);
      if (profile.total_tags_received >= 100) await this.awardBadge(userId, BADGE_TAGS_100);

    } catch (error) {
      this.logger.error(
        `Failed to check/award cumulative badges for user ${userId}`,
        error.stack,
      );
    }
  }

  // TODO: İleride "MVP sayısına göre rozet ver" gibi daha karmaşık
  // 'checkAndAwardMvpBadges(userId)' fonksiyonları buraya eklenebilir.
}
