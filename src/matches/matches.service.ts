// src/matches/matches.service.ts

import { 
    Injectable,
    Inject,
    NotFoundException,
    ConflictException,
    ForbiddenException,
    BadRequestException,
    Logger
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
// MatchPrivacy ve MatchStatus'ü import et
import { Match, MatchPrivacy, MatchStatus, MatchJoinType } from './match.entity'; 
import { Repository, DataSource } from 'typeorm'; // <-- MoreThan'ı silebiliriz, yeni tarih metodu daha iyi
import { MatchParticipant, ParticipantStatus } from './match-participant.entity';
import { CreateMatchDto } from './dto/create-match.dto';
import { GetMatchesDto } from './dto/get-matches.dto';
import { User } from '../users/user.entity';
import { JoinMatchDto } from './dto/join-match.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { SubmitAttendanceDto } from './dto/submit-attendance.dto';

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);
  
  
  constructor(
    // Bu servis 3 şeye "enjekte" oluyor:
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,

    @InjectRepository(MatchParticipant)
    private matchParticipantRepository: Repository<MatchParticipant>,

    @Inject(DataSource)
    private dataSource: DataSource, // Transaction'ı yönetmek için
  ) {}

  /**
   * Yeni bir maç oluşturur VE organizatörü bu maça
   * ilk katılımcı ('accepted') olarak ekler.
   * Tüm bu işlemleri tek bir transaction içinde yapar.
   */
  /**
   * YENİ GÜNCELLENMİŞ FONKSİYON:
   * Yeni bir maç oluşturur.
   * ÇAKIŞMA KONTROLÜ EKLENDİ.
   */
  async createMatch(
    createMatchDto: CreateMatchDto,
    organizer: User,
  ): Promise<Match> {
    
    const { field_id, start_time, duration_minutes } = createMatchDto;

    // 1. YENİ KONTROL: ÇAKIŞMA KONTROLÜ
    const newStartTime = new Date(start_time);
    const newEndTime = new Date(
      newStartTime.getTime() + duration_minutes * 60000,
    );

    const conflictingMatch = await this.matchRepository
      .createQueryBuilder('match')
      .where('match.field_id = :field_id', { field_id })
      .andWhere('match.status = :status', { status: 'scheduled' as MatchStatus })
      .andWhere(
        // PostgreSQL OVERLAPS operatörü: İki zaman aralığı kesişiyor mu?
        `
        (match.start_time, match.start_time + make_interval(mins => match.duration_minutes)) 
        OVERLAPS 
        (:newStartTime::timestamptz, :newEndTime::timestamptz)
        `,
        { newStartTime, newEndTime },
      )
      .getOne();

    if (conflictingMatch) {
      throw new ConflictException(
        'Bu saha, seçtiğiniz tarih ve saat aralığında zaten dolu.'
      );
    }
    // --- KONTROL BİTTİ ---

    // 2. Transaction'ı Başlat (Eski kod)
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 3. Maçı Oluştur (Eski kod)
      const newMatch = this.matchRepository.create({
        ...createMatchDto,
        organizer_id: organizer.id,
      });
      const savedMatch = await queryRunner.manager.save(newMatch);

      // 4. Kaptanı Katılımcı Olarak Ekle (Eski kod)
      const captainAsParticipant = this.matchParticipantRepository.create({
        match_id: savedMatch.id,
        user_id: organizer.id,
        status: 'accepted',
        position_request: 'organizer',
      });
      await queryRunner.manager.save(captainAsParticipant);

      // 5. İşlemi Onayla (Eski kod)
      await queryRunner.commitTransaction();
      return savedMatch;

    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findPublicMatches(getMatchesDto: GetMatchesDto): Promise<any[]> {
    const { 
      latitude, 
      longitude, 
      radius = 50000, // Varsayılan 20km
      start_after, 
      start_before 
    } = getMatchesDto;

    const VOTE_WINDOW_MINUTES = 60;

    // 1. Temel Sorgu Oluşturucu (Query Builder)
    // 'match' takma adıyla matches tablosundan başlıyoruz
    const query = this.matchRepository.createQueryBuilder('match')
      
      // 2. 'fields' tablosunu 'field' takma adıyla JOIN (birleştir)
      // Bu, sahanın konumuyla filtreleme yapabilmemiz için gerekli
      .innerJoin('match.field', 'field')

      // 3. Katılımcı sayısını hesaplamak için 'match_participants' tablosunu JOIN
      // Sadece 'accepted' statüsündeki katılımcıları say
      .leftJoin(
        'match.participants', 
        'participant', 
        "participant.status = 'accepted'"
      )

      // 4. İhtiyacımız olan ana sütunları seç (performans için)
      .select([
        'match.id as match_id',
        'match.start_time',
        'match.duration_minutes',
        'match.format',
        'match.notes',
        'field.name as field_name', // Sahadan adı al
      ])

      // 5. Katılımcı sayısını 'participantCount' olarak say ve ekle
      .addSelect('COUNT(participant.id)', 'participantCount')

      // 6. PostGIS Coğrafi Filtrelemesi (en önemli kısım)
      // 'field.location' sütununu kullanarak yakındakileri bul
      .where(
        `
        ST_DWithin(
          field.location, 
          ST_MakePoint(:longitude, :latitude)::geography, 
          :radius
        )
        `,
        { longitude, latitude, radius },
      )

      // 7. Ek Filtreler
      .andWhere('match.privacy_type = :privacy', { privacy: 'public' as MatchPrivacy })
      .andWhere('match.status = :status', { status: 'scheduled' as MatchStatus })
      
      // Sadece gelecekteki maçları getir (ya DTO'dan gelen tarihi ya da şimdiki zamanı kullan)
     .andWhere(
        "match.start_time + make_interval(mins => match.duration_minutes + :voteWindow) > :now",
        { voteWindow: VOTE_WINDOW_MINUTES, now: new Date() }
      );

    // // Opsiyonel 'start_before' (şu tarihten önce) filtresi
    // if (start_before) {
    //   query.andWhere('match.start_time < :before', { before: start_before });
    // }

    // 8. Sonuçları Grupla ve Sırala
    return query
      .groupBy('match.id, field.name') // Sayımın (COUNT) doğru çalışması için
      .orderBy('match.start_time', 'ASC') // En yakın tarihli maçı en üstte göster
      .getRawMany(); // getMany() yerine getRawMany() çünkü COUNT gibi özel sütunlar ekledik
  }

  /**
   * YENİ FONKSİYON:
   * Giriş yapmış bir kullanıcının, :matchId ile belirtilen maça
   * katılması veya başvurması işlemini yönetir.
   */
  async joinMatch(
    matchId: string, 
    user: User, 
    joinMatchDto: JoinMatchDto
  ): Promise<MatchParticipant> {
    
    const match = await this.matchRepository.findOneBy({ id: matchId });
    if (!match) throw new NotFoundException('Katılmaya çalıştığınız maç bulunamadı');
    if (match.status !== 'scheduled' as MatchStatus) throw new ForbiddenException('Bu maç artık oynanmayacak veya tamamlandı');

    const existingParticipant = await this.matchParticipantRepository.findOne({
      where: { match_id: matchId, user_id: user.id },
    });
    if (existingParticipant) throw new ConflictException(`Bu maça zaten ${existingParticipant.status} statüsündesiniz`);

    const { join_type, format } = match; // format'ı al
    const { position_request } = joinMatchDto;

    let newStatus: ParticipantStatus;

    if (join_type === 'open' as MatchJoinType) {
      
      // --- YENİ KAPASİTE KONTROLÜ ---
      const maxCapacity = this.getMaxCapacityFromFormat(format);
      const currentCount = await this.matchParticipantRepository.count({
        where: { match_id: matchId, status: 'accepted' as ParticipantStatus }
      });
      
      if (currentCount >= maxCapacity) {
        throw new ForbiddenException('Maç kadrosu zaten dolu.');
      }
      // --- KONTROL BİTTİ ---

      newStatus = 'accepted';
    } else {
      newStatus = 'requested';
    }

    const newParticipant = this.matchParticipantRepository.create({
      match_id: matchId,
      user_id: user.id,
      status: newStatus,
      position_request: position_request,
    });

    return await this.matchParticipantRepository.save(newParticipant);
  }

  /**
   * YENİ FONKSİYON:
   * Tek bir maçın tüm detaylarını getirir.
   * Maç + Saha + Organizatör + Katılımcılar (ve onların profilleri)
   */
  async getMatchDetails(matchId: string): Promise<Match> {
    
    // 1. Maçı ve ilişkili olduğu temel verileri bul
    // TypeORM'in "relations" özelliğini kullanarak
    // ilişkili tabloları otomatik olarak çekiyoruz.
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
      relations: [
        'field',            // Maçın 'field' ilişkisini yükle
        'organizer',        // Maçın 'organizer' (User) ilişkisini yükle
        'participants',     // Maçın 'participants' listesini yükle
        
        // Şimdi, her bir katılımcının ilişkilerini yüklüyoruz:
        'participants.user', // Katılımcının 'user' (isim, foto) ilişkisi
        
        // Katılımcının 'user' objesinin 'playerProfile' ilişkisi
        // (Bu, 'player_profiles' tablosuna bağlanır)
        'participants.user.playerProfile', 
      ],
    });

    if (!match) {
      throw new NotFoundException('Maç bulunamadı');
    }

    // 2. İsteğe bağlı filtreleme:
    // Sadece 'accepted' statüsündeki katılımcıları döndürmek
    // veya bu filtrelemeyi Flutter tarafında yapmak isteyebiliriz.
    // Şimdilik tüm katılımcıları (accepted, requested) döndürelim.
    // Flutter'da 'Kaptan Onayı Bekleyenler' listesi de yapabiliriz.
    
    // match.participants = match.participants.filter(
    //   p => p.status === 'accepted'
    // );

    return match;
  }

  /**
   * YENİ FONKSİYON:
   * Giriş yapmış bir kullanıcının, :matchId ile belirtilen maçtan
   * kaydını siler (ayrılır).
   */
  async leaveMatch(matchId: string, user: User): Promise<{ message: string }> {
    
    // 1. Maçı Bul (Sadece var mı diye kontrol için)
    const match = await this.matchRepository.findOneBy({ id: matchId });
    if (!match) {
      throw new NotFoundException('Ayrılmaya çalıştığınız maç bulunamadı');
    }

    // 2. Maç Zaten Oynanmış mı Kontrol Et
    if (match.status !== 'scheduled' as MatchStatus) {
      throw new ForbiddenException('Bu maçın katılımcı listesi kilitlendi (tamamlandı veya iptal edildi)');
    }

    // 3. Kullanıcının Katılım Kaydını Bul
    const participantRecord = await this.matchParticipantRepository.findOne({
      where: { match_id: matchId, user_id: user.id },
    });

    if (!participantRecord) {
      // Kullanıcı zaten maçta değil
      throw new NotFoundException('Bu maça zaten kayıtlı değilsiniz');
    }

    // 4. Kaptan Maçtan Ayrılamaz (Maçı İptal Etmesi Gerekir)
    // Bu önemli bir iş kuralı. Kaptan ayrılırsa maç sahipsiz kalır.
    if (match.organizer_id === user.id) {
      throw new ForbiddenException('Maçın organizatörü olarak maçtan ayrılamazsınız. Maçı iptal etmelisiniz.');
    }

    // 5. Katılım Kaydını Sil
    await this.matchParticipantRepository.remove(participantRecord);

    // Başarı mesajı döndür
    return { message: 'Maçtan başarıyla ayrıldınız.' };
  }

  /**
   * YENİ FONKSİYON:
   * Bir maç kaptanının, bir katılımcının statüsünü
   * ('accepted' veya 'declined') güncellemesini sağlar.
   */
 async updateParticipantStatus(
    matchId: string,
    participantId: string,
    user: User, 
    updateParticipantDto: UpdateParticipantDto,
  ): Promise<MatchParticipant> {
    
    const match = await this.matchRepository.findOneBy({ id: matchId });
    if (!match) throw new NotFoundException('Yönetmeye çalıştığınız maç bulunamadı');
    if (match.organizer_id !== user.id) throw new ForbiddenException('Sadece maçın organizatörü katılımcıları yönetebilir');

    const participantRecord = await this.matchParticipantRepository.findOne({
      where: { id: participantId, match_id: matchId },
    });
    if (!participantRecord) throw new NotFoundException('Güncellenmek istenen katılımcı kaydı bulunamadı');
    if (participantRecord.status !== 'requested' as ParticipantStatus) throw new ForbiddenException(`Bu katılımcının statüsü zaten '${participantRecord.status}' olarak ayarlanmış.`);

    const { status } = updateParticipantDto;

    if (status === 'accepted') {
      
      // --- YENİ KAPASİTE KONTROLÜ ---
      const maxCapacity = this.getMaxCapacityFromFormat(match.format);
      const currentCount = await this.matchParticipantRepository.count({
        where: { match_id: matchId, status: 'accepted' as ParticipantStatus }
      });
      
      // NOT: Mevcut oyuncu henüz 'accepted' olmadığı için "büyük eşit" (>=) kullandık
      if (currentCount >= maxCapacity) {
        throw new ForbiddenException('Maç kadrosu zaten dolu. Bu oyuncuyu onaylayamazsınız.');
      }
      // --- KONTROL BİTTİ ---

      participantRecord.status = 'accepted';
      return await this.matchParticipantRepository.save(participantRecord);
    } 
    
    if (status === 'declined') {
      // Kaydı sil
      await this.matchParticipantRepository.remove(participantRecord);
      // Geçici nesne yerine basit bir başarı mesajı döndür
      return { success: true, message: 'Katılımcı başarıyla reddedildi.' } as any; 
      // 'as any' kullandık çünkü fonksiyonun dönüş tipi normalde MatchParticipant,
      // ama bu özel durumda farklı bir yapı döndürüyoruz. Alternatif olarak dönüş tipi
      // Promise<MatchParticipant | { success: boolean, message: string }> yapılabilir.
    }

    // Güvenlik: Geçersiz durum değeri gelirse
    throw new BadRequestException("Geçersiz 'status' değeri. 'accepted' veya 'declined' olmalıdır.");
  }

  /**
   * YENİ YARDIMCI FONKSİYON:
   * "7v7" gibi bir string'i 14 gibi bir sayıya çevirir.
   */
  private getMaxCapacityFromFormat(format: string): number {
    try {
      const parts = format.toLowerCase().split('v');
      if (parts.length === 2) {
        const capacity = parseInt(parts[0], 10) * 2;
        if (!isNaN(capacity)) return capacity;
      }
    } catch (e) {
      // Hata durumunda logla
    }
    this.logger.warn(`Invalid match format received: ${format}. Defaulting to 14.`);
    return 14; // Hatalı formatta varsayılan 14 kişi (7v7)
  }

  /**
   * YENİ FONKSİYON:
   * Bir maç kaptanının, bir katılımcının maça
   * gelip gelmediğini (attended) işaretlemesini sağlar.
   */
  async updateAttendance(
    matchId: string,
    participantId: string, // 'match_participants' kaydının ID'si
    user: User, // İsteği yapan KAPTAN
    updateAttendanceDto: UpdateAttendanceDto,
  ): Promise<MatchParticipant> {
    
    // 1. Maçı ve Kaptanı Bul
    const match = await this.matchRepository.findOneBy({ id: matchId });
    if (!match) {
      throw new NotFoundException('Yönetmeye çalıştığınız maç bulunamadı');
    }

    // 2. YETKİLENDİRME: İsteği yapan, kaptan mı?
    if (match.organizer_id !== user.id) {
      throw new ForbiddenException('Sadece maçın organizatörü katılım durumunu güncelleyebilir');
    }

    // 3. Güncellenecek Katılımcı Kaydını Bul
    const participantRecord = await this.matchParticipantRepository.findOne({
      where: { id: participantId, match_id: matchId },
    });

    if (!participantRecord) {
      throw new NotFoundException('Güncellenmek istenen katılımcı kaydı bulunamadı');
    }
    
    // 4. Sadece 'kabul edilmiş' katılımcılar işaretlenebilir
    if (participantRecord.status !== 'accepted' as ParticipantStatus) {
      throw new ForbiddenException(`Bu katılımcı maça kabul edilmemiş.`);
    }

    // 5. Durumu Güncelle
    participantRecord.attended = updateAttendanceDto.attended;
    
    return await this.matchParticipantRepository.save(participantRecord);
  }

  /**
   * YENİ FONKSİYON: (TOPLU GÜNCELLEME)
   * Bir maç kaptanının, maçın nihai katılım listesini
   * toplu olarak onaylamasını sağlar.
   */
  async submitMatchAttendance(
    matchId: string,
    user: User, // İsteği yapan KAPTAN
    submitAttendanceDto: SubmitAttendanceDto,
  ): Promise<{ message: string }> {
    
    // 1. Maçı ve Kaptanı Bul
    const match = await this.matchRepository.findOneBy({ id: matchId });
    if (!match) {
      throw new NotFoundException('Yönetmeye çalıştığınız maç bulunamadı');
    }

    // 2. YETKİLENDİRME: İsteği yapan, kaptan mı?
    if (match.organizer_id !== user.id) {
      throw new ForbiddenException('Sadece maçın organizatörü katılım listesini onaylayabilir');
    }

    // 3. Maçın 'kabul edilmiş' tüm katılımcılarını bul
    const acceptedParticipants = await this.matchParticipantRepository.find({
      where: { match_id: matchId, status: 'accepted' as ParticipantStatus },
    });

    // 4. Gelen 'gelmedi' listesini hızlı arama için bir Set'e dönüştür
    const noShowUserIds = new Set(submitAttendanceDto.noShowUserIds);

    // 5. TOPLU GÜNCELLEME İÇİN TRANSACTION BAŞLAT
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 6. Tüm katılımcılar üzerinde döngüye gir
      for (const participant of acceptedParticipants) {
        
        if (noShowUserIds.has(participant.user_id)) {
          // Eğer katılımcının ID'si 'gelmedi' listesindeyse
          participant.attended = false;
        } else {
          // Listede DEĞİLSE, o zaman gelmiş demektir
          participant.attended = true;
        }
        
        // Güncellenmiş kaydı transaction ile kaydet
        await queryRunner.manager.save(participant);
      }

      // 7. İşlemi onayla
      await queryRunner.commitTransaction();

      return { message: 'Katılım listesi başarıyla güncellendi.' };

    } catch (err) {
      // Hata olursa geri al
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      // Bağlantıyı serbest bırak
      await queryRunner.release();
    }
  }
}