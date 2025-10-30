// src/profile/dto/update-profile.dto.ts
import {
  IsString,
  IsOptional,
  IsIn,
  IsDateString,
  MaxLength,
  IsPostalCode,
} from 'class-validator';
import { PlayerProfile } from '../../player-profiles/player-profile.entity'; // Enum tipleri için

// PlayerProfile entity'sinden tipleri alalım
type PreferredFootType = PlayerProfile['preferred_foot'];
type PreferredPositionType = PlayerProfile['preferred_position'];

export class UpdateProfileDto {
  @IsString()
  @IsOptional() // Opsiyonel
  @MaxLength(100) // Çok uzun isimleri engelle
  full_name?: string;

  @IsDateString()
  @IsOptional()
  birth_date?: Date; // String olarak gelip Date'e çevrilecek

  @IsString()
  @IsOptional()
  @MaxLength(50)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50) // Veya eyalet kodları için daha kısa (örn: 2)
  state?: string;

  @IsPostalCode('US') // ABD posta kodu formatı
  @IsOptional()
  zip_code?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255) // URL uzun olabilir
  profile_image_url?: string;

  // PlayerProfile Alanları
  @IsIn(['right', 'left', 'both']) // Sadece bu değerler kabul edilir
  @IsOptional()
  preferred_foot?: PreferredFootType;

  @IsIn(['forward', 'midfielder', 'defender', 'goalkeeper'])
  @IsOptional()
  preferred_position?: PreferredPositionType;
}