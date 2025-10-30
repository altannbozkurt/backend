// src/matches/dto/join-match.dto.ts

import { IsString, IsOptional } from 'class-validator';

export class JoinMatchDto {
  
  @IsString()
  @IsOptional() // Bu alan zorunlu değil
  position_request?: string; // 'defans', 'forvet' vb.
}