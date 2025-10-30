// src/tasks/tasks.module.ts

import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../matches/match.entity';
import { MatchParticipant } from '../matches/match-participant.entity';
import { MatchMvpVote } from '../votes/match-mvp-vote.entity';
import { MatchTagVote } from '../votes/match-tag-vote.entity';
import { PlayerProfile } from '../player-profiles/player-profile.entity';
import { User } from '../users/user.entity';
import { BadgesModule } from '../badges/badges.module'; // <-- YENİ İMPORT


@Module({
  imports: [
    // Puan hesaplaması için gereken tüm tablolar
    TypeOrmModule.forFeature([
      Match,
      MatchParticipant,
      MatchMvpVote,
      MatchTagVote,
      PlayerProfile,
      User,
    ]),
    BadgesModule, // <-- YENİ İMPORT
  ],
  providers: [TasksService],
})
export class TasksModule {}