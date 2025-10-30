// src/matches/dto/get-matches.dto.ts

import { 
  IsLatitude, 
  IsLongitude, 
  IsNumber, 
  IsOptional, 
  Min, 
  IsDateString 
} from 'class-validator';
import { Type } from 'class-transformer';

export class GetMatchesDto {
  
  // --- Konum Filtreleri (PostGIS için) ---
  @IsLatitude()
  @Type(() => Number) // Gelen 'string' query parametresini sayıya çevir
  latitude: number;

  @IsLongitude()
  @Type(() => Number)
  longitude: number;

  @IsNumber()
  @Min(1000) // En az 1km (1000 metre)
  @IsOptional()
  @Type(() => Number)
  radius?: number; // metre cinsinden (varsayılan 20000)

  // --- Tarih Filtreleri (Opsiyonel) ---
  @IsDateString()
  @IsOptional()
  start_after?: string; // Bu tarihten sonraki maçlar (ISO 8601 formatı)

  @IsDateString()
  @IsOptional()
  start_before?: string; // Bu tarihten önceki maçlar
}