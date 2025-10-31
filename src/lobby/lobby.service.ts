import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { User } from '../users/user.entity';
import { LobbyPosting } from './lobby-posting.entity';
import { LobbyResponse } from './lobby-response.entity';
import { CreateLobbyPostDto } from './dto/create-lobby-post.dto';
import { CreateLobbyResponseDto } from './dto/create-lobby-response.dto';

@Injectable()
export class LobbyService {
  constructor(
    @InjectRepository(LobbyPosting)
    private lobbyPostRepository: Repository<LobbyPosting>,
    @InjectRepository(LobbyResponse)
    private lobbyResponseRepository: Repository<LobbyResponse>,
  ) {}

  /**
   * Yeni bir Lobi ilanı oluşturur (Oyuncu veya Rakip Arama)
   */
  async createPost(
    user: User,
    createDto: CreateLobbyPostDto,
  ): Promise<LobbyPosting> {
    const newPost = this.lobbyPostRepository.create({
      ...createDto,
      creator_user_id: user.id,
      status: 'open',
    });
    return this.lobbyPostRepository.save(newPost);
  }

  /**
   * Açık ve tarihi geçmemiş tüm ilanları listeler
   */
  async getOpenPosts(): Promise<LobbyPosting[]> {
    return this.lobbyPostRepository.find({
      where: {
        status: 'open',
        match_time: MoreThan(new Date()), // Sadece gelecekteki maçlar
      },
      relations: ['creator', 'field'], // İlan sahibi ve saha bilgisiyle
      order: {
        match_time: 'ASC', // En yakın tarihli olanlar üstte
      },
    });
  }

  /**
   * Tek bir ilanın detayını (başvurularıyla birlikte) getirir
   */
  async getPostDetails(postId: string): Promise<LobbyPosting> {
    const post = await this.lobbyPostRepository.findOne({
      where: { id: postId },
      relations: ['creator', 'field', 'responses', 'responses.responder'],
    });

    if (!post) {
      throw new NotFoundException('İlan bulunamadı');
    }
    return post;
  }

  /**
   * Bir ilana başvuru yapar
   */
  async createResponse(
    user: User,
    postId: string,
    createDto: CreateLobbyResponseDto,
  ): Promise<LobbyResponse> {
    const post = await this.lobbyPostRepository.findOneBy({ id: postId });
    if (!post) {
      throw new NotFoundException('İlan bulunamadı');
    }
    if (post.creator_user_id === user.id) {
      throw new ForbiddenException('Kendi ilanınıza başvuramazsınız');
    }

    // Zaten başvurmuş mu diye kontrol et
    const existingResponse = await this.lobbyResponseRepository.findOne({
      where: { post_id: postId, responder_user_id: user.id },
    });
    if (existingResponse) {
      throw new ConflictException('Bu ilana zaten başvurdunuz');
    }

    const newResponse = this.lobbyResponseRepository.create({
      ...createDto,
      post_id: postId,
      responder_user_id: user.id,
      status: 'pending',
    });
    return this.lobbyResponseRepository.save(newResponse);
  }

  /**
   * İlan sahibi olarak bir başvuruyu kabul eder
   * TODO: Bu fonksiyonu geliştirmemiz gerekecek.
   */
  async acceptResponse(
    user: User,
    responseId: string,
  ): Promise<LobbyResponse> {
    const response = await this.lobbyResponseRepository.findOne({
      where: { id: responseId },
      relations: ['post'], // İlanı da (post) beraberinde getir
    });

    if (!response) {
      throw new NotFoundException('Başvuru bulunamadı');
    }
    if (response.post.creator_user_id !== user.id) {
      throw new ForbiddenException(
        'Sadece ilan sahibi başvuruları onaylayabilir',
      );
    }
    if (response.status !== 'pending') {
      throw new ConflictException('Bu başvuru zaten işleme alınmış');
    }

    // 1. Başvuruyu 'accepted' yap
    response.status = 'accepted';
    
    // 2. İlanı 'filled' yap
    // TODO: 'players_needed' 1'den fazlaysa, sayacı düşür ve dolmadıysa 'filled' yapma
    await this.lobbyPostRepository.update(response.post_id, { status: 'filled' });

    // TODO: (Gelecekte) 'OPPONENT_WANTED' ise,
    // otomatik olarak yeni bir Maç (Match) oluştur ve iki kaptanı da ekle.
    
    return this.lobbyResponseRepository.save(response);
  }
}