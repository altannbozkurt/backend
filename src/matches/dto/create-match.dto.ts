// src/matches/dto/create-match.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsDateString,
  IsInt,
  IsOptional,
  IsIn,
  Min,
} from 'class-validator';
import * as matchEntity from '../match.entity';

export class CreateMatchDto {
  
  @IsUUID() // Sahayı seçtiği ekrandan gelen ID
  @IsNotEmpty()
  field_id: string;

  @IsDateString() // '2025-10-25T20:00:00.000Z' gibi ISO 8601 formatı
  @IsNotEmpty()
  start_time: string;

  @IsInt()
  @Min(30) // En az 30 dakika
  @IsNotEmpty()
  duration_minutes: number;

  @IsString()
  @IsNotEmpty()
  format: string; // '7v7', '6v6' vb.

  @IsIn(['public', 'private'])
  @IsOptional()
  privacy_type?: matchEntity.MatchPrivacy; // 'public' veya 'private'

  @IsIn(['open', 'approval_required'])
  @IsOptional()
  join_type?: matchEntity.MatchJoinType; // 'open' veya 'approval_required'

  @IsString()
  @IsOptional()
  notes?: string;
}