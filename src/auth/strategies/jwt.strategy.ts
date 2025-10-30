// src/auth/strategies/jwt.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../users/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      // 1. Bileti (JWT) isteğin 'Authorization' header'ından 'Bearer' token olarak oku
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      
      // 2. Süresi dolmuş token'ları görmezden gelme (hata ver)
      ignoreExpiration: false,
      
      // 3. Token'ı imzalamak için kullandığımız GİZLİ anahtarı .env'den al
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  // 4. Token başarılı bir şekilde çözüldüğünde bu fonksiyon çalışır
  // 'payload' bizim login olurken token'ın içine koyduğumuz veridir
  // (yani { sub: user.id, phone: user.phone_number })
  async validate(payload: { sub: string; phone: string }): Promise<User> {
    
    // 5. Token'ın içindeki 'sub' (yani user.id) ile 
    // veritabanında bir kullanıcı var mı diye kontrol et
    const user = await this.userRepository.findOneBy({ id: payload.sub });

    if (!user) {
      // Eğer kullanıcı veritabanında bulunamazsa (silinmiş vb.)
      // bu token artık geçersizdir.
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }

    // 6. Her şey yolundaysa, 'user' nesnesini döndür
    // NestJS bu nesneyi otomatik olarak isteğin (request) içine 
    // 'request.user' olarak ekleyecektir.
    return user;
  }
}