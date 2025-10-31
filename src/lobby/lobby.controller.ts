import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { User } from '../users/user.entity';
import { LobbyService } from './lobby.service';
import { CreateLobbyPostDto } from './dto/create-lobby-post.dto';
import { CreateLobbyResponseDto } from './dto/create-lobby-response.dto';

@Controller('lobby')
@UseGuards(AuthGuard('jwt')) // Bütün Lobi işlemleri giriş gerektirir
export class LobbyController {
  constructor(private readonly lobbyService: LobbyService) {}

  /**
   * YENİ: Lobi ilanı oluştur (Oyuncu/Rakip Arama)
   * POST /lobby
   */
  @Post()
  createPost(
    @Req() req: Request & { user: User },
    @Body() createDto: CreateLobbyPostDto,
  ) {
    return this.lobbyService.createPost(req.user, createDto);
  }

  /**
   * YENİ: Aktif lobi ilanlarını listele
   * GET /lobby
   */
  @Get()
  getOpenPosts() {
    return this.lobbyService.getOpenPosts();
  }

  /**
   * YENİ: Tek bir lobi ilanının detayını getir
   * GET /lobby/:id
   */
  @Get(':id')
  getPostDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.lobbyService.getPostDetails(id);
  }

  /**
   * YENİ: Bir lobi ilanına başvuru yap
   * POST /lobby/:id/respond
   */
  @Post(':id/respond')
  createResponse(
    @Req() req: Request & { user: User },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createDto: CreateLobbyResponseDto,
  ) {
    return this.lobbyService.createResponse(req.user, id, createDto);
  }

  /**
   * YENİ: Bir başvuruyu kabul et (İlan sahibi)
   * POST /lobby/responses/:responseId/accept
   */
  @Post('responses/:responseId/accept')
  acceptResponse(
    @Req() req: Request & { user: User },
    @Param('responseId', ParseUUIDPipe) responseId: string,
  ) {
    return this.lobbyService.acceptResponse(req.user, responseId);
  }
}