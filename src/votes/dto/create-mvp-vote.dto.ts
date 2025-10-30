// src/votes/dto/create-mvp-vote.dto.ts

import { IsLatitude, IsLongitude, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateMvpVoteDto {
  
  // MVP olarak seçilen oyuncunun USER ID'si
  @IsUUID()
  @IsNotEmpty()
  voted_user_id: string;

  // Oynanma Kanıtı (Konum)
  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;
}