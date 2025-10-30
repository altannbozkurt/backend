// src/profile/profile.controller.ts

import { Controller, Get, Req, UseGuards, Patch, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport'; // <-- GÜVENLİK GÖREVLİSİ
import { Request } from 'express'; // <-- Request tipini almak için
import { ProfileService } from './profile.service';
import { User } from '../users/user.entity'; // User tipini almak için
import { UpdateProfileDto } from './dto/update-profile.dto'; // <-- YENİ DTO

@Controller('profile') // Bu controller /profile yolunu dinler
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // --- İLK KORUMALI ENDPOINT'İMİZ ---
  @Get('me') // GET /profile/me yolunu dinler
  @UseGuards(AuthGuard('jwt')) // <-- SİHİRLİ SATIR: "Bu endpoint'i koru!"
  getMyProfile(@Req() req: Request & { user: User }) {
    
    // @Req() ile 'request' nesnesine erişiyoruz.
    // JwtStrategy'miz, 'request.user' içine giriş yapan kullanıcının
    // tüm bilgilerini eklemişti.
    const user = req.user; // Request'ten kullanıcıyı alıyoruz
    if (!user?.id) { // Güvenlik kontrolü
        throw new Error('User ID not found in token');
    }

    // Servise, giriş yapan kullanıcının ID'sini verip profilini istiyoruz.
    return this.profileService.getFullUserProfileById(user.id);
  }

  // --- YENİ ENDPOINT: Kendi Profilini Güncelleme ---
  @Patch('me') // PATCH /profile/me
  @UseGuards(AuthGuard('jwt')) // Korumalı
  updateMyProfile(
    @Req() req: Request & { user: User }, // Giriş yapmış kullanıcıyı al
    @Body() updateProfileDto: UpdateProfileDto, // Gövdedeki veriyi al ve DTO ile doğrula
  ) {
    const user = req.user;
    if (!user?.id) throw new Error('User ID not found in token');

    // Servise kullanıcı ID'sini ve güncellenecek veriyi gönder
    return this.profileService.updateMyProfile(user.id, updateProfileDto);
  }
}