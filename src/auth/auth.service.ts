// src/auth/auth.service.ts

import {
  Injectable,
  ConflictException,
  Inject,
  NotFoundException, // <-- Hata için bunu ekledik
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { PlayerProfile } from '../player-profiles/player-profile.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto'; // <-- Login DTO'yu import et
import { JwtService } from '@nestjs/jwt'; // <-- JWT Servisini import et

@Injectable()
export class AuthService {
  
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @Inject(DataSource)
    private dataSource: DataSource,

    // JwtService'i constructor'a enjekte ediyoruz
    private jwtService: JwtService, // <-- YENİ EKLENDİ
  ) {}

  // --- KAYIT (REGISTER) FONKSİYONUMUZ (DOKUNMADIK) ---
  async register(registerUserDto: RegisterUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { phone_number: registerUserDto.phone_number },
    });

    if (existingUser) {
      throw new ConflictException('Bu telefon numarası zaten kayıtlı');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newUser = queryRunner.manager.create(User, { ...registerUserDto });
      await queryRunner.manager.save(newUser);

      const newProfile = queryRunner.manager.create(PlayerProfile, {
        user_id: newUser.id,
        user: newUser,
      });
      await queryRunner.manager.save(newProfile);

      await queryRunner.commitTransaction();
      return newUser;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // --- YENİ LOGIN FONKSİYONUMUZ ---
  async login(loginUserDto: LoginUserDto): Promise<{ access_token: string }> {
    
    // 1. Kullanıcıyı Telefon Numarasıyla Bul
    const { phone_number } = loginUserDto;
    const user = await this.userRepository.findOne({
      where: { phone_number },
    });

    // 2. Kullanıcı Yoksa Hata Ver
    // (Gerçek bir SMS sisteminde, burada da "Bu numara kayıtlı değil" demek yerine
    // güvenlik için "Kod gönderildi" derdik ama şu an bu daha net.)
    if (!user) {
      throw new NotFoundException('Bu telefon numarasına sahip bir kullanıcı bulunamadı');
    }

    // 3. Kullanıcı Varsa, "Giriş Biletini" (JWT) Oluştur
    // Biletin içine kullanıcının kimliğini (ID) ve telefonunu ekliyoruz.
    const payload = { 
      sub: user.id, // 'sub' (subject) JWT standardıdır, kullanıcının ID'sini tutar
      phone: user.phone_number 
    };

    // 4. Bileti İmzala ve Geri Döndür
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      access_token: accessToken,
    };
  }
}