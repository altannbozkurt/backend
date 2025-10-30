// src/matches/matches.module.ts

import { Module } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { AuthModule } from '../auth/auth.module'; // <-- GÜVENLİK İÇİN
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './match.entity'; // <-- Match tablosu
import { MatchParticipant } from './match-participant.entity'; // <-- Katılımcı tablosu

@Module({
  imports: [
    AuthModule, // <-- Korumalı endpoint'ler için
    TypeOrmModule.forFeature([
      Match, 
      MatchParticipant
    ]), // <-- İki tabloyu da kullan
  ],
  controllers: [MatchesController],
  providers: [MatchesService],
})
export class MatchesModule {}