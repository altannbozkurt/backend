// src/app.module.ts

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config'; // <-- 1. BUNU İÇERİ AKTAR
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './users/user.entity';
import { PlayerProfile } from './player-profiles/player-profile.entity';
import { Field } from './fields/field.entity';
import { Match } from './matches/match.entity';
import { MatchParticipant } from './matches/match-participant.entity';
import { MatchMvpVote } from './votes/match-mvp-vote.entity';
import { MatchTagVote } from './votes/match-tag-vote.entity';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { FieldsModule } from './fields/fields.module';
import { MatchesModule } from './matches/matches.module';
import { VotesModule } from './votes/votes.module';
import { TasksModule } from './tasks/tasks.module';
import { BadgesModule } from './badges/badges.module';
import { Badge } from './badges/badge.entity';
import { UserBadge } from './badges/user-badge.entity';
import { LobbyModule } from './lobby/lobby.module';
import { LobbyPosting } from './lobby/lobby-posting.entity';
import { LobbyResponse } from './lobby/lobby-response.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // .env dosyasını okumak için ConfigModule'ü en üste ekliyoruz
    ConfigModule.forRoot({
      isGlobal: true, // Config'i tüm modüllerde kullanılabilir yap
    }), // <-- 2. BU BLOĞU EKLE
    // --- VERİTABANI BAĞLANTISI BURADA BAŞLIYOR ---
    TypeOrmModule.forRoot({
      type: 'postgres', // Veritabanı türümüz: PostgreSQL
      host: 'localhost', // Docker'da çalıştırdığımız için 'localhost'
      port: 5432, // PostgreSQL'in varsayılan portu
      
      // !! DİKKAT: Bu bilgileri Docker'ı kurarken belirlediğin bilgilerle değiştir
      username: 'postgres', // Docker'da belirlediğin kullanıcı adı (genellikle 'postgres'tir)
      password: 'postgres', // Docker'da belirlediğin şifre
      database: 'postgres', // Docker'da belirlediğin veritabanı adı (genellikle 'postgres'tir)

      entities: [User, PlayerProfile, Field, Match, MatchParticipant, MatchMvpVote, MatchTagVote, Badge, UserBadge, LobbyPosting, LobbyResponse], // Buraya birazdan oluşturacağımız Entity'leri ekleyeceğiz
      
      // --- GELİŞTİRME İÇİN SİHİRLİ AYAR ---
      // 'synchronize: true' ayarı, TypeORM'ye der ki:
      // "Kodumdaki Entity sınıflarına bak ve veritabanı tablolarımı 
      // otomatik olarak bu sınıflara göre oluştur/güncelle."
      // Bu, 'migration' (5. Adım) ihtiyacını şimdilik ortadan kaldırır ve işimizi çok hızlandırır.
      // migration'ın yerini TUTMAZ ama öğrenme aşaması için mükemmeldir.
      synchronize: true, 
    }),
    AuthModule,
    ProfileModule,
    FieldsModule,
    MatchesModule,
    VotesModule,
    TasksModule,
    BadgesModule,
    LobbyModule,
    // --- VERİTABANI BAĞLANTISI BURADA BİTTİ ---
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}