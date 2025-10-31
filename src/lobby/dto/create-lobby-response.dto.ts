import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateLobbyResponseDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  message: string;
}