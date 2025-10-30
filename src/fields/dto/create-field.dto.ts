// src/fields/dto/create-field.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsLatitude, // Enlem doğrulaması
  IsLongitude, // Boylam doğrulaması
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

// Gelen JSON'daki enlem/boylamı doğrulamak için
// küçük bir alt-DTO
class LocationDto {
  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;
}

export class CreateFieldDto {
  
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  address?: string;

  // Gelen veriyi (JSON) doğrula ve LocationDto'ya dönüştür
  @Type(() => LocationDto)
  @IsNotEmpty()
  location: LocationDto; // Örn: { "latitude": 40.7128, "longitude": -74.0060 }

  @IsBoolean()
  @IsOptional()
  has_showers?: boolean;

  @IsBoolean()
  @IsOptional()
  is_indoor?: boolean;
}