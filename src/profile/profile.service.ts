// src/profile/profile.service.ts

import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { PlayerProfile } from '../player-profiles/player-profile.entity';
import { Repository, DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Logger } from '@nestjs/common';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    @InjectRepository(PlayerProfile)
    private profileRepository: Repository<PlayerProfile>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  // "Bana bu ID'li kullanıcının profilini getir" fonksiyonu
  // --- FONKSİYON GÜNCELLENDİ: ARTIK USER DÖNDÜRÜYOR ---
  // Fonksiyon adını da değiştirebiliriz: getFullUserProfileById
  async getFullUserProfileById(userId: string): Promise<User> {

    // User'ı ID ile bul ve 'playerProfile' ilişkisini de yükle
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: {
         playerProfile: true, // playerProfile ilişkisini getir
         userBadges: true, // userBadges ilişkisini getir
      },
      // VEYA User entity'sindeki @OneToOne ilişkisine { eager: true } ekleyebiliriz
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // playerProfile ilişkisinin de yüklendiğinden emin olalım (eager değilse)
    // if (!user.playerProfile) {
    //    // İlişki yüklenmemişse manuel olarak yüklenebilir veya hata verilebilir
    //    // Ama yukarıdaki 'relations' bunu sağlamalı
    // }

    // Hassas bilgileri (şifre vb.) DÖNDÜRMEDEN ÖNCE KALDIR!
    // delete user.password; // Eğer varsa

    return user; // Tam User nesnesini (playerProfile dahil) döndür
  }

  // ----- YENİ METOD: Kendi Profilini Güncelle -----
  async updateMyProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    
    // Transaction başlatalım (User ve PlayerProfile güncellenecek)
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Kullanıcıyı ve İlişkili Profilini Bul
      const user = await queryRunner.manager.findOne(User, {
          where: { id: userId },
          relations: { playerProfile: true, userBadges: true }, // Profilini de getir
      });

      if (!user || !user.playerProfile) {
        throw new NotFoundException(`User or PlayerProfile with ID ${userId} not found`);
      }

      // 2. User Entity'sini Güncelle (DTO'da gelen alanlarla)
      // Object.assign(user, updateProfileDto); // Bu tehlikeli olabilir, DTO'da olmayan alanları da etkileyebilir
      // Sadece DTO'da tanımlı User alanlarını güncelleyelim:
      if (updateProfileDto.full_name !== undefined) user.full_name = updateProfileDto.full_name;
      if (updateProfileDto.birth_date !== undefined) user.birth_date = updateProfileDto.birth_date;
      if (updateProfileDto.city !== undefined) user.city = updateProfileDto.city;
      if (updateProfileDto.state !== undefined) user.state = updateProfileDto.state;
      if (updateProfileDto.zip_code !== undefined) user.zip_code = updateProfileDto.zip_code;
      if (updateProfileDto.profile_image_url !== undefined) user.profile_image_url = updateProfileDto.profile_image_url;

      // 3. PlayerProfile Entity'sini Güncelle (DTO'da gelen alanlarla)
      const profile = user.playerProfile;
      if (updateProfileDto.preferred_foot !== undefined) profile.preferred_foot = updateProfileDto.preferred_foot;
      if (updateProfileDto.preferred_position !== undefined) profile.preferred_position = updateProfileDto.preferred_position;


      // 4. Güncellenmiş Entity'leri Kaydet
      await queryRunner.manager.save(user); // User'ı kaydet (ilişkili profil de güncellenir mi?)
      await queryRunner.manager.save(profile); // Emin olmak için profili de ayrı kaydedelim


      // 5. Transaction'ı Onayla
      await queryRunner.commitTransaction();

      // Güncellenmiş User nesnesini döndür (ilişkili profil dahil)
       // Hassas bilgileri (şifre vb.) DÖNDÜRMEDEN ÖNCE KALDIR!
       // delete user.password; 
      return user;

    } catch (err) {
      // Hata olursa geri al
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to update profile for user ${userId}`, err.stack); // Logger ekleyebiliriz
      throw err; // Hatayı tekrar fırlat
    } finally {
      // Bağlantıyı serbest bırak
      await queryRunner.release();
    }
  }
   // --- GÜNCELLEME BİTTİ ---

  // Eski fonksiyonu (sadece profil döndüren) istersen tutabilirsin
  // veya silebilirsin. Şimdilik yorum satırı yapalım:
  /*
  async getProfileByUserId(userId: string): Promise<PlayerProfile> {
    const profile = await this.profileRepository.findOneBy({ user_id: userId });
    if (!profile) {
      throw new NotFoundException('Bu kullanıcıya ait profil bulunamadı');
    }
    return profile;
  }
  */
}