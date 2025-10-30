// src/votes/votes.controller.ts

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VotesService } from './votes.service';
import { CreateMvpVoteDto } from './dto/create-mvp-vote.dto';
import { CreateTagVoteDto } from './dto/create-tag-vote.dto';
import { Request } from 'express';
import { User } from '../users/user.entity';


@Controller('votes') // Bu controller /votes yolunu dinler
@UseGuards(AuthGuard('jwt')) // Tüm oylama işlemleri giriş gerektirir
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  /**
   * BİR MAÇ İÇİN MVP OYU GÖNDERİR
   * POST /votes/matches/:matchId/mvp
   */
  @Post('matches/:matchId/mvp')
  submitMvpVote(
    @Param('matchId') matchId: string,
    @Req() req: Request & { user: User }, // Oyu vereni (giriş yapmış kullanıcı) al
    @Body() createMvpVoteDto: CreateMvpVoteDto,
  ) {
    const user = req.user as User;
    return this.votesService.submitMvpVote(matchId, user, createMvpVoteDto);
  }

  /**
   * BİR MAÇ İÇİN ETİKET OYU GÖNDERİR
   * POST /votes/matches/:matchId/tag
   */
  @Post('matches/:matchId/tag')
  submitTagVote(
    @Param('matchId') matchId: string,
    @Req() req: Request & { user: User }, // Oyu vereni al
    @Body() createTagVoteDto: CreateTagVoteDto,
  ) {
    const user = req.user as User;
    return this.votesService.submitTagVote(matchId, user, createTagVoteDto);
  }

  /**
   * YENİ: Bu maç için mevcut kullanıcının oy durumunu döndürür
   * GET /votes/matches/:matchId/me
   */
  @Get('matches/:matchId/me')
  getMyVoteStatus(
    @Param('matchId') matchId: string,
    @Req() req: Request & { user: User },
  ) {
    const user = req.user as User;
    return this.votesService.getMyVoteStatus(matchId, user);
  }
}