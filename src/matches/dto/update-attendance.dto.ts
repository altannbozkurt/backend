// src/matches/dto/update-attendance.dto.ts

import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateAttendanceDto {
  
  @IsBoolean() // Gelen veri true veya false olmalı
  @IsNotEmpty()
  attended: boolean;
}