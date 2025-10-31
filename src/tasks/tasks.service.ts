// src/tasks/tasks.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule'; // Zamanlayıcı için
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, LessThan, MoreThan, DataSource, Not } from 'typeorm';
import { Match, MatchStatus } from '../matches/match.entity';
import { MatchParticipant } from '../matches/match-participant.entity';
import { MatchMvpVote } from '../votes/match-mvp-vote.entity';
import { MatchTagVote } from '../votes/match-tag-vote.entity';
import { PlayerProfile } from '../player-profiles/player-profile.entity';
import { User } from '../users/user.entity';
import { BadgesService } from '../badges/badges.service'; // <-- YENİ İMPORT


// Rozet ID'lerini sabit olarak tanımlayalım
const BADGE_FIRST_MATCH = 'FIRST_MATCH_COMPLETED';
//const BADGE_MVP_BRONZE = 'MVP_BRONZE';

// ... diğer rozet ID'leri


@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectRepository(MatchParticipant)
    private participantRepository: Repository<MatchParticipant>,
    @InjectRepository(MatchMvpVote)
    private mvpVoteRepository: Repository<MatchMvpVote>,
    @InjectRepository(MatchTagVote)
    private tagVoteRepository: Repository<MatchTagVote>,
    @InjectRepository(PlayerProfile)
    private profileRepository: Repository<PlayerProfile>,
    private dataSource: DataSource, // Toplu güncelleme için
    private  readonly badgesService: BadgesService,
  ) {}

  /**
   * HER 10 DAKİKADA BİR ÇALIŞAN ZAMANLANMIŞ GÖREV
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleProcessFinishedMatches() {
    this.logger.log('Starting to process finished matches...');

    // 1. Bitmiş ama henüz işlenmemiş maçları bul
    // (Bitiş zamanı son 3 saat içinde olan ve statüsü 'scheduled' olanlar)
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const now = new Date();

    const matchesToProcess = await this.matchRepository
      .createQueryBuilder('match')
      .where('match.status = :status', { status: 'scheduled' as MatchStatus })
      .andWhere(
        "match.start_time + make_interval(mins => match.duration_minutes) BETWEEN :threeHoursAgo AND :now",
        { threeHoursAgo, now },
      )
      .getMany();

    if (matchesToProcess.length === 0) {
      this.logger.log('No matches to process.');
      return;
    }

    this.logger.log(`Found ${matchesToProcess.length} matches to process.`);

    // 2. Her maçı tek tek işle
    for (const match of matchesToProcess) {
      await this.processMatchStats(match);
    }
  }

  /**
   * Tek bir maçın tüm verilerini işler, puanları hesaplar ve günceller.
   */
  private async processMatchStats(match: Match) {
    this.logger.log(`Processing stats for match ID: ${match.id}`);

    // A. Maçın tüm katılımcılarını ('attended' bilgisiyle) çek
    const participants = await this.participantRepository.find({
      where: { match_id: match.id, status: 'accepted' as any },
    });
    
    // Eğer 'attended' bilgisi (kaptan onayı) henüz girilmemişse, bu maçı atla
    // (veya en az bir 'attended' null değilse devam et)
    if (participants.length === 0 || participants.every(p => p.attended === null)) {
      this.logger.warn(`Skipping match ${match.id}: Attendance data is missing.`);
      return;
    }

    const participantUserIds = participants.map((p) => p.user_id);

    // B. Maçın tüm oylarını çek
    const mvpVotes = await this.mvpVoteRepository.find({ where: { match_id: match.id } });
    const tagVotes = await this.tagVoteRepository.find({ where: { match_id: match.id } });

    // C. Tüm katılımcıların profillerini tek seferde çek
    const profiles = await this.profileRepository.find({
      where: { user_id: In(participantUserIds) },
    });

    const profileMap = new Map(profiles.map((p) => [p.user_id, p]));


    // --- YENİ EKLENEN MVP HESAPLAMA MANTIĞI (Döngüden Önce) ---

    // 1. Tüm oyları bir haritada (Map) topla (voted_user_id -> vote_count)
    const mvpVoteCounts = new Map<string, number>();
    for (const vote of mvpVotes) {
      const userId = vote.voted_user_id;
      // Haritadaki mevcut sayıyı al (yoksa 0) ve 1 ekle
      mvpVoteCounts.set(userId, (mvpVoteCounts.get(userId) || 0) + 1);
    }

    // 2. En yüksek oy sayısını bul
    let maxVotes = 0;
    if (mvpVoteCounts.size > 0) {
      // Map'in 'values' (oy sayıları) üzerinden en büyüğünü bul
      maxVotes = Math.max(...Array.from(mvpVoteCounts.values()));
    }

    // 3. Kazananları (veya berabere kalanları) bul (Eğer en az 1 oy varsa)
    const mvpWinners: string[] = [];
    if (maxVotes > 0) {
      for (const [userId, count] of mvpVoteCounts.entries()) {
        if (count === maxVotes) {
          mvpWinners.push(userId); // En çok oyu alanları listeye ekle
        }
      }
    }
    // --- YENİ MVP MANTIĞI BİTTİ ---


    // D. Puanları Hesapla ve Güncelle (Transaction içinde)
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    

    try {
      for (const participant of participants) {
        const profile = profileMap.get(participant.user_id);
        if (!profile) continue;

        // Numeric alanları sayıya çevirerek string birleştirme hatalarını önle
        profile.participation_rate = Number(profile.participation_rate);
        profile.cancellation_rate  = Number(profile.cancellation_rate);
        profile.no_show_rate       = Number(profile.no_show_rate);

        profile.overall_rating = Number(profile.overall_rating);
        profile.stat_pac       = Number(profile.stat_pac);
        profile.stat_sho       = Number(profile.stat_sho);
        profile.stat_pas       = Number(profile.stat_pas);
        profile.stat_dri       = Number(profile.stat_dri);
        profile.stat_def       = Number(profile.stat_def);
        profile.stat_phy       = Number(profile.stat_phy);
        profile.fair_play_score = Number(profile.fair_play_score); // EKLENDİ

        // YENİ Kümülatif sayaçları da sayıya çevir
        profile.total_matches_played = Number(profile.total_matches_played);
        profile.total_mvps_won = Number(profile.total_mvps_won);
        profile.total_tags_received = Number(profile.total_tags_received);
        // --- BİTTİ: Sayısal alanları çevirme ---

        // --- D1. Güvenilirlik Puanı Güncellemesi ---
        if (participant.attended === true) {
          // Oyuncu geldiyse: Güvenilirliğini artır (veya sabit tut)
          profile.participation_rate = Math.min(100, profile.participation_rate + 1);

          // YENİ: Toplam maçı artır
          profile.total_matches_played += 1;

          // --- ROZET MANTIĞI: İLK MAÇ ---
          // Katılımcı maça 'geldi' ise, ona 'İLK MAÇ' rozetini ver
          await this.badgesService.awardBadge(participant.user_id, BADGE_FIRST_MATCH);
          // --- ROZET MANTIĞI BİTTİ ---

        } else if (participant.attended === false) {
          // Oyuncu GELMEDİYSE (no-show): Güvenilirliğini sert düşür
          profile.participation_rate = Math.max(0, profile.participation_rate - 5);
          profile.no_show_rate = profile.no_show_rate + 1; // Sayacı artır
        }

        // --- D2. İstatistik (Stat) Güncellemesi ---
        
        // (Eski 'receivedMvpVotes' satırı kaldırıldı)

        // Kaç etiket aldı?
        const receivedTags = tagVotes.filter(
          (v) => v.tagged_user_id === participant.user_id,
        );
        
        // --- DEĞİŞTİRİLEN PUANLAMA ALGORİTMASI ---

        // SADECE GERÇEK MVP KAZANANI (veya kazananları) bonusu alır
        if (mvpWinners.includes(participant.user_id)) {
            // Bu kişi kazananlar listesindeyse, bonusu ver
            const mvpBonus = 0.5; // (Tüm statlara 0.5 bonus)
            profile.stat_pac += mvpBonus;
            profile.stat_sho += mvpBonus;
            profile.stat_pas += mvpBonus;
            profile.stat_dri += mvpBonus;
            profile.stat_def += mvpBonus;
            profile.stat_phy += mvpBonus;

            // YENİ: Toplam MVP kazançını artır
            profile.total_mvps_won += 1;
            
            // --- ROZET MANTIĞI: MVP ---
            // Rozeti de SADECE kazananlar almalı
            //await this.badgesService.awardBadge(participant.user_id, BADGE_MVP_BRONZE);
        }

        if(receivedTags.length > 0){
            // YENİ: Toplam etiket sayısını artır
            profile.total_tags_received += receivedTags.length;
        }
        
        
        // Her etiket, ilgili stata +0.2 ekler (TÜM EKLENTİLER DAHİL)
        const tagBonus = 0.2; 
        for (const tag of receivedTags) {
          if (tag.tag_id === 'FINISHING') profile.stat_sho += tagBonus;
          if (tag.tag_id === 'DEFENDING') profile.stat_def += tagBonus;
          if (tag.tag_id === 'PASSING') profile.stat_pas += tagBonus;
          
          // --- EKSİK OLAN VE EKLENEN KISIM ---
          if (tag.tag_id === 'DRIBBLING') {
            profile.stat_dri += tagBonus;
          }
          if (tag.tag_id === 'TEAM_PLAYER') {
            // "Takım Motoru"nu fiziksel dayanaklılık (stat_phy) olarak yorumlayabiliriz
            profile.stat_phy += tagBonus;
          }
          if (tag.tag_id === 'FAIR_PLAY') {
            // Ayrı bir stat olan fair_play_score'u artıralım (örn: +1 puan)
            profile.fair_play_score = Math.min(100, profile.fair_play_score + 1.0);
          }
          // --- EKSİK KISIM BİTTİ ---
        }

        // (Eski 'profile.overall_rating += ...' satırı kaldırıldı)

        // Genel reytingi, statların ortalaması olarak yeniden hesapla (artık MVP bonusu da dahil)
        profile.overall_rating = 
          (profile.stat_pac + profile.stat_sho + profile.stat_pas + 
           profile.stat_dri + profile.stat_def + profile.stat_phy) / 6;

        // Oyuncu kartını 'gümüş' veya 'altın'a yükselt
        if (profile.overall_rating >= 75) profile.card_type = 'gold';
        else if (profile.overall_rating >= 65) profile.card_type = 'silver';

        // --- ROZET MANTIĞI (MVP) ---
        // (Bu blok yukarıdaki 'if (mvpWinners.includes...)' içine taşındı)


        // Güncellenmiş profili transaction ile kaydet
        await queryRunner.manager.save(profile);

        // --- D3. YENİ KÜMÜLATİF ROZET KONTROLÜ ---
        // Profil kaydedildikten SONRA, güncel profile ile rozet servisini çağır
        await this.badgesService.checkAndAwardCumulativeBadges(
          participant.user_id,
          profile,
        );
      }

      // E. Maçın statüsünü 'completed' olarak işaretle
      match.status = 'completed' as MatchStatus;
      await queryRunner.manager.save(match);
      
      // F. Transaction'ı onayla
      await queryRunner.commitTransaction();
      this.logger.log(`Successfully processed stats for match ID: ${match.id}`);

    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to process stats for match ${match.id}`, err.stack);
    } finally {
      await queryRunner.release();
    }
  }
}