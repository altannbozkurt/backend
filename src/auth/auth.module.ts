// src/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { PlayerProfile } from '../player-profiles/player-profile.entity';
import { PassportModule } from '@nestjs/passport'; // <-- YENİ
import { JwtModule } from '@nestjs/jwt'; // <-- YENİ
import { ConfigModule, ConfigService } from '@nestjs/config'; // <-- YENİ
import type { StringValue } from 'ms';
import { JwtStrategy } from './strategies/jwt.strategy'; // <-- YENİ

@Module({
  imports: [
    // Veritabanı tablolarımızı import ediyoruz
    TypeOrmModule.forFeature([User, PlayerProfile]),

    // Passport modülünü import ediyoruz
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JWT Modülünü asenkron olarak yapılandırıyoruz
    JwtModule.registerAsync({
      imports: [ConfigModule], // .env'yi okuyabilmek için ConfigModule'ü import et
      inject: [ConfigService], // ConfigService'i bu yapılandırmaya "enjekte et"
      useFactory: (configService: ConfigService) => {
        // .env dosyasından gizli anahtarı ve süreyi çek
        return {
          secret: configService.getOrThrow<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: configService.getOrThrow<StringValue>('JWT_EXPIRES_IN'),
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [PassportModule, JwtStrategy],
})
export class AuthModule {}