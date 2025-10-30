// src/auth/dto/register-user.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsPhoneNumber,
  IsPostalCode, // Posta kodu doğrulaması için
} from 'class-validator';

export class RegisterUserDto {

  // --- DEĞİŞİKLİK BAŞLIYOR ---
  @IsPhoneNumber('US') // 'TR' yerine 'US' olarak güncelliyoruz
  @IsNotEmpty()
  phone_number: string;
  // --- DEĞİŞİKLİK BİTTİ ---

  @IsString()
  @IsNotEmpty()
  full_name: string;

  @IsDateString()
  @IsOptional()
  birth_date?: Date;

  @IsString()
  @IsOptional()
  city?: string;

  // --- DEĞİŞİKLİKLER BAŞLIYOR ---

  @IsString()
  @IsOptional()
  state?: string; // district yerine state

  @IsPostalCode('US') // ABD posta kodu formatını doğrula
  @IsOptional()
  zip_code?: string; // zip_code eklendi

  // --- DEĞİŞİKLİKLER BİTTİ ---
}