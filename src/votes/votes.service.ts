// src/votes/votes.service.ts

import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Match } from '../matches/match.entity';
import { Field } from '../fields/field.entity';
import { MatchParticipant, ParticipantStatus } from '../matches/match-participant.entity';
import { MatchMvpVote } from './match-mvp-vote.entity';
import { MatchTagVote } from './match-tag-vote.entity';
import { User } from '../users/user.entity';
import { CreateMvpVoteDto } from './dto/create-mvp-vote.dto';
import { CreateTagVoteDto } from './dto/create-tag-vote.dto';

@Injectable()
export class VotesService {
  
  // Oylama penceresi (maç bitiminden sonra 60 dakika)
  private readonly VOTE_WINDOW_MINUTES = 60;
  // Konum toleransı (500 metre)
  private readonly VOTE_RADIUS_METERS = 2000;

  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectRepository(Field)
    private fieldRepository: Repository<Field>, // Konum sorgusu için
    @InjectRepository(MatchParticipant)
    private participantRepository: Repository<MatchParticipant>,
    @InjectRepository(MatchMvpVote)
    private mvpVoteRepository: Repository<MatchMvpVote>,
    @InjectRepository(MatchTagVote)
    private tagVoteRepository: Repository<MatchTagVote>,
  ) {}

  /**
   * YENİ FONKSİYON: (MVP OYU GÖNDERME)
   */
  async submitMvpVote(
    matchId: string,
    user: User, // Oyu veren
    createMvpVoteDto: CreateMvpVoteDto,
  ): Promise<MatchMvpVote> {
    
    // 1. KENDİNE OY VERME KONTROLÜ
    if (user.id === createMvpVoteDto.voted_user_id) {
      throw new BadRequestException('Kendinize MVP oyu veremezsiniz');
    }

    // 2. OYNANMA KANITI KONTROLÜ
    // (Zaman, Konum ve Katılım kontrolü)
    await this.validateProofOfPlay(
      matchId,
      user,
      createMvpVoteDto.latitude,
      createMvpVoteDto.longitude,
    );
    
    // 3. MÜKERRER OY KONTROLÜ
    const existingVote = await this.mvpVoteRepository.findOne({
      where: { match_id: matchId, voter_user_id: user.id },
    });
    if (existingVote) {
      throw new ConflictException('Bu maç için zaten MVP oyu kullandınız');
    }

    // 4. OYU OLUŞTUR VE KAYDET
    const newMvpVote = this.mvpVoteRepository.create({
      match_id: matchId,
      voter_user_id: user.id,
      voted_user_id: createMvpVoteDto.voted_user_id,
    });
    
    return this.mvpVoteRepository.save(newMvpVote);
  }

  /**
   * YENİ FONKSİYON: (ETİKET OYU GÖNDERME)
   */
  async submitTagVote(
    matchId: string,
    user: User, // Oyu veren
    createTagVoteDto: CreateTagVoteDto,
  ): Promise<MatchTagVote> {

    // 1. KENDİNE OY VERME KONTROLÜ
    if (user.id === createTagVoteDto.tagged_user_id) {
      throw new BadRequestException('Kendinizi etiketleyemezsiniz');
    }

    // 2. OYNANMA KANITI KONTROLÜ
    await this.validateProofOfPlay(
      matchId,
      user,
      createTagVoteDto.latitude,
      createTagVoteDto.longitude,
    );

    // 3. MÜKERRER OY KONTROLÜ
    const existingVote = await this.tagVoteRepository.findOne({
      where: { match_id: matchId, voter_user_id: user.id },
    });
    if (existingVote) {
      throw new ConflictException('Bu maç için zaten etiket oyu kullandınız');
    }

    // 4. OYU OLUŞTUR VE KAYDET
    const newTagVote = this.tagVoteRepository.create({
      match_id: matchId,
      voter_user_id: user.id,
      tagged_user_id: createTagVoteDto.tagged_user_id,
      tag_id: createTagVoteDto.tag_id,
    });
    
    return this.tagVoteRepository.save(newTagVote);
  }

  /**
   * YENİ: Kullanıcının bu maç için oy kullanıp kullanmadığını döndürür
   */
  async getMyVoteStatus(matchId: string, user: User): Promise<{ has_voted_mvp: boolean; has_voted_tag: boolean }> {
    // Maçın varlığını doğrulamak opsiyonel; doğrudan oylara bakmak yeterli
    const [mvp, tag] = await Promise.all([
      this.mvpVoteRepository.findOne({ where: { match_id: matchId, voter_user_id: user.id } }),
      this.tagVoteRepository.findOne({ where: { match_id: matchId, voter_user_id: user.id } }),
    ]);
    return {
      has_voted_mvp: !!mvp,
      has_voted_tag: !!tag,
    };
  }

  /**
   * ÖZEL GÜVENLİK FONKSİYONU: (OYNANMA KANITI)
   * Bir oylamanın geçerli olup olmadığını kontrol eder.
   */
  private async validateProofOfPlay(
    matchId: string,
    user: User,
    latitude: number,
    longitude: number,
  ): Promise<void> { // Bir şey döndürmez, hata yoksa geçer
    
    // 1. MAÇI BUL
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
    });
    if (!match) {
      throw new NotFoundException('Oylama yapılmak istenen maç bulunamadı');
    }

    // 2. KATILIM KONTROLÜ
    // Oyuncu, 'kabul edilmiş' VE kaptan tarafından 'geldi' (attended: true)
    // olarak işaretlenmiş olmalı.
    const participant = await this.participantRepository.findOne({
      where: {
        match_id: matchId,
        user_id: user.id,
        status: 'accepted' as ParticipantStatus,
      },
    });

    if (!participant) {
      throw new ForbiddenException('Bu maçın kabul edilmiş bir katılımcısı değilsiniz');
    }
    if (participant.attended !== true) {
      throw new ForbiddenException('Maça katılımınız kaptan tarafından henüz onaylanmadı veya "gelmedi" olarak işaretlendiniz');
    }

    // 3. ZAMAN KONTROLÜ
    const matchEndTime = new Date(match.start_time.getTime() + match.duration_minutes * 60000);
    const voteDeadline = new Date(matchEndTime.getTime() + this.VOTE_WINDOW_MINUTES * 60000);
    const now = new Date();

    if (now < matchEndTime || now > voteDeadline) {
      throw new ForbiddenException(
        `Oylama şu an aktif değil. Oylama penceresi ${this.VOTE_WINDOW_MINUTES} dakikadır.`,
      );
    }

    // 4. KONUM KONTROLÜ (PostGIS)
    // Maçın yapıldığı sahanın 500m yakınında mı?
    // Bu sorgu, TypeORM yerine doğrudan SQL ve PostGIS'e güvenir.
    const isCloseEnough = await this.matchRepository
      .createQueryBuilder('match')
      .innerJoin('match.field', 'field')
      .where('match.id = :matchId', { matchId })
      .andWhere(
        `ST_DWithin(
          field.location, 
          ST_MakePoint(:longitude, :latitude)::geography, 
          :radius
        )`,
        { longitude, latitude, radius: this.VOTE_RADIUS_METERS },
      )
      .getOne(); // Şart sağlanıyorsa maçı, sağlanmıyorsa null döndürür

    if (!isCloseEnough) {
      throw new ForbiddenException(`Oylama yapmak için halı sahaya yeterince (${this.VOTE_RADIUS_METERS}m) yakın değilsiniz.`);
    }

    // Tüm kontrollerden geçti.
    return;
  }
}