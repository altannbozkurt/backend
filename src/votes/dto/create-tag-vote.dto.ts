// src/votes/dto/create-tag-vote.dto.ts

import { IsNotEmpty, IsString, IsUUID, IsLatitude, IsLongitude } from 'class-validator';

export class CreateTagVoteDto {
  
  // Etiketlenen oyuncunun USER ID'si
  @IsUUID()
  @IsNotEmpty()
  tagged_user_id: string;

  // Verilen etiketin kimliği (Örn: 'FINISHING', 'DEFENDING')
  @IsString()
  @IsNotEmpty()
  tag_id: string;

  // Oynanma Kanıtı (Konum)
  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;
}