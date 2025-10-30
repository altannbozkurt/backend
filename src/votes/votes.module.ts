// src/votes/votes.module.ts

import { Module } from '@nestjs/common';
import { VotesController } from './votes.controller';
import { VotesService } from './votes.service';
import { AuthModule } from '../auth/auth.module'; // <-- GÜVENLİK İÇİN
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchMvpVote } from './match-mvp-vote.entity'; // <-- Oylama Tablosu 1
import { MatchTagVote } from './match-tag-vote.entity'; // <-- Oylama Tablosu 2
import { Match } from '../matches/match.entity'; // <-- Maç Detayları İçin
import { Field } from '../fields/field.entity'; // <-- Konum Kontrolü İçin
import { MatchParticipant } from '../matches/match-participant.entity'; // <-- Katılımcı Kontrolü İçin

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      MatchMvpVote,
      MatchTagVote,
      Match,
      Field,
      MatchParticipant,
    ]),
  ],
  controllers: [VotesController],
  providers: [VotesService],
})
export class VotesModule {}