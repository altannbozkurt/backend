// src/matches/dto/update-participant.dto.ts

import { IsEnum, IsNotEmpty } from 'class-validator';
import { ParticipantStatus } from '../match-participant.entity';

// Sadece bu iki durumun seçilebilmesini istiyoruz
type UpdateStatus = 'accepted' | 'declined';

export class UpdateParticipantDto {
  
  @IsEnum(['accepted', 'declined']) // Gelen veri 'accepted' veya 'declined' olmalı
  @IsNotEmpty()
  status: UpdateStatus;
}