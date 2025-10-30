// src/fields/dto/get-nearby-fields.dto.ts

import { IsLatitude, IsLongitude, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetNearbyFieldsDto {
  
  @IsLatitude()
  @Type(() => Number) // Gelen 'string'i sayıya çevir
  latitude: number;

  @IsLongitude()
  @Type(() => Number)
  longitude: number;

  @IsNumber()
  @Min(1000) // En az 1km
  @IsOptional()
  @Type(() => Number)
  radius?: number; // metre cinsinden (örn: 5000)
}