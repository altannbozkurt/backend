// src/matches/matches.controller.ts

import { Controller, Post, Body, UseGuards, Req, Get, Query, Param, Delete, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { AuthGuard } from '@nestjs/passport'; // KORUMA GÖREVLİMİZ
import { CreateMatchDto } from './dto/create-match.dto';
import { GetMatchesDto } from './dto/get-matches.dto'; // <-- EKLE
import express from 'express';
import { User } from '../users/user.entity';
import { JoinMatchDto } from './dto/join-match.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { SubmitAttendanceDto } from './dto/submit-attendance.dto';

@Controller('matches') // Bu controller /matches yolunu dinler
@UseGuards(AuthGuard('jwt')) // DİKKAT: Tüm /matches endpoint'lerini koru!
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  /**
   * YENİ BİR MAÇ OLUŞTURUR
   * POST /matches
   */
  @Post()
  createMatch(
    @Body() createMatchDto: CreateMatchDto,
    @Req() req: express.Request & { user: User }, // Korumalı endpoint'ten 'request'i al
  ) {
    const user = req.user; // Kaptanın kim olduğunu al
    
    // Gelen DTO'yu ve Kaptanın kim olduğunu servise pasla
    return this.matchesService.createMatch(createMatchDto, user);
  }
  /**
   * YENİ ENDPOINT:
   * HERKESE AÇIK MAÇLARI LİSTELER (ANA SAYFA KEŞFET)
   * GET /matches?latitude=...&longitude=...&radius=...
   */
  @Get()
  findPublicMatches(@Query() getMatchesDto: GetMatchesDto) {
    
    // Gelen query parametrelerini DTO'ya göre doğrula
    // (main.ts'teki 'transform: true' sayesinde çalışır)
    // ve servise pasla
    return this.matchesService.findPublicMatches(getMatchesDto);
  }

   /**
   * YENİ ENDPOINT:
   * TEK BİR MAÇIN TÜM DETAYLARINI GETİRİR (Maç Detay Ekranı)
   * GET /matches/:matchId
   */
  @Get(':matchId')
  getMatchDetails(
    @Param('matchId') matchId: string,
  ) {
    return this.matchesService.getMatchDetails(matchId);
  }
  /**
   * YENİ ENDPOINT:
   * BİR MAÇA KATILMA VEYA BAŞVURMA
   * POST /matches/:matchId/join
   */
  @Post(':matchId/join') // :matchId dinamik bir parametredir
  joinMatch(
    @Param('matchId') matchId: string, // URL'den :matchId'yi al
    @Req() req: express.Request & { user: User }, // Giriş yapan kullanıcıyı al
    @Body() joinMatchDto: JoinMatchDto, // Pozisyon talebini body'den al
  ) {
    const user = req.user as User;
    return this.matchesService.joinMatch(matchId, user, joinMatchDto);
  }
  /**
   * YENİ ENDPOINT:
   * BİR MAÇTAN AYRILMA
   * DELETE /matches/:matchId/leave
   */
  @Delete(':matchId/leave') // <-- DELETE metodu
  @HttpCode(HttpStatus.OK) // Silme başarılı olduğunda 204 yerine 200 OK ve bir mesaj döndür
  leaveMatch(
    @Param('matchId') matchId: string, // URL'den :matchId'yi al
    @Req() req: express.Request & { user: User }, // Giriş yapan kullanıcıyı al
  ) {
    const user = req.user as User;
    return this.matchesService.leaveMatch(matchId, user);
  }

  /**
   * YENİ ENDPOINT:
   * KAPTANIN BİR KATILIMCIYI ONAYLAMASI / REDDETMESİ
   * PATCH /matches/:matchId/participants/:participantId
   */
  @Patch(':matchId/participants/:participantId')
  updateParticipantStatus(
    @Param('matchId') matchId: string, // URL'den maç ID'sini al
    @Param('participantId') participantId: string, // URL'den katılımcı kaydının ID'sini al
    @Req() req: express.Request & { user: User }, // Giriş yapan KAPTAN'ı al
    @Body() updateParticipantDto: UpdateParticipantDto, // 'accepted' veya 'declined'
  ) {
    const user = req.user as User;
    return this.matchesService.updateParticipantStatus(
      matchId,
      participantId,
      user,
      updateParticipantDto,
    );
  }

  /**
   * YENİ ENDPOINT:
   * KAPTANIN BİR KATILIMCININ 'GELDİ'/'GELMEDİ' DURUMUNU İŞARETLEMESİ
   * PATCH /matches/:matchId/participants/:participantId/attendance
   */
  @Patch(':matchId/participants/:participantId/attendance')
  updateAttendance(
    @Param('matchId') matchId: string,
    @Param('participantId') participantId: string,
    @Req() req: express.Request & { user: User }, // Giriş yapan KAPTAN'ı al
    @Body() updateAttendanceDto: UpdateAttendanceDto, // { "attended": true }
  ) {
    const user = req.user as User;
    return this.matchesService.updateAttendance(
      matchId,
      participantId,
      user,
      updateAttendanceDto,
    );
  }

  /**
   * YENİ ENDPOINT: (TOPLU GÜNCELLEME)
   * KAPTANIN MAÇ BİTİMİ KATILIM LİSTESİNİ TOPLU ONAYLAMASI
   * POST /matches/:matchId/attendance
   */
  @Post(':matchId/attendance')
  submitMatchAttendance(
    @Param('matchId') matchId: string,
    @Req() req: express.Request & { user: User }, // Giriş yapan KAPTAN'ı al
    @Body() submitAttendanceDto: SubmitAttendanceDto, // { "noShowUserIds": [...] }
  ) {
    const user = req.user as User;
    return this.matchesService.submitMatchAttendance(
      matchId,
      user,
      submitAttendanceDto,
    );
  }
}