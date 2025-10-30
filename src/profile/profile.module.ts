// src/profile/profile.module.ts

import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { AuthModule } from '../auth/auth.module'; // <-- 1. AUTH MODÜLÜNÜ İÇERİ AKTAR
import { TypeOrmModule } from '@nestjs/typeorm'; // <-- 2. TYPEORM'U İÇERİ AKTAR
import { PlayerProfile } from '../player-profiles/player-profile.entity'; // <-- 3. PROFİLİ İÇERİ AKTAR
import { User } from '../users/user.entity'; // <-- 4. USER'İ İÇERİ AKTAR
import { UsersProfileController } from './users-profile.controller';

@Module({
  imports: [
    AuthModule, // <-- 4. AUTH'U EKLE (GÜVENLİK İÇİN)
    TypeOrmModule.forFeature([PlayerProfile, User]), // <-- 5. PROFİL TABLOSUNU EKLE
  ],
  controllers: [ProfileController, UsersProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}