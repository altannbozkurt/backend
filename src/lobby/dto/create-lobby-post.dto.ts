import {
  IsString,
  IsEnum,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsOptional,
  MinLength,
} from 'class-validator';
import * as lobbyPostingEntity from '../lobby-posting.entity';


export class CreateLobbyPostDto {
  @IsEnum(['PLAYER_WANTED', 'OPPONENT_WANTED'])
  type: lobbyPostingEntity.LobbyPostType;

  @IsString()
  @MinLength(5)
  title: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsUUID()
  @IsOptional() // Saha opsiyonel olabilir
  field_id: string;

  @IsDateString()
  match_time: string; // "2025-12-30T20:00:00.000Z" formatında

  @IsInt()
  @Min(5)
  @Max(11)
  team_size: number; // 5v5, 7v7 etc.

  @IsInt()
  @Min(1)
  @IsOptional()
  players_needed: number;

  @IsString()
  @IsOptional()
  position_needed: string;
}