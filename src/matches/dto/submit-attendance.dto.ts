// src/matches/dto/submit-attendance.dto.ts

import { IsArray, IsUUID } from 'class-validator';

export class SubmitAttendanceDto {
  
  // Kaptan bize sadece 'gelmeyen' oyuncuların USER ID'lerini
  // bir dizi (array) içinde gönderecek.
  @IsArray()
  @IsUUID('all', { each: true }) // Dizideki her elemanın UUID olmasını garantile
  noShowUserIds: string[]; // Örn: ['uuid-of-player-1', 'uuid-of-player-2']
}