import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { LobbyPosting } from './lobby-posting.entity';
import { LobbyResponse } from './lobby-response.entity';
import { LobbyService } from './lobby.service';
import { LobbyController } from './lobby.controller';
// Diğer modüllerden entity'lere ihtiyacımız olabilir (örn: User)
// Ancak bunlar AuthModule ve diğer modüllerde zaten global olabilir
// Şimdilik import etmeye gerek yok, sadece kendi entity'lerimiz yeterli.

@Module({
  imports: [
    TypeOrmModule.forFeature([LobbyPosting, LobbyResponse]),
    AuthModule, // AuthGuard'ı kullanabilmek için
  ],
  providers: [LobbyService],
  controllers: [LobbyController],
})
export class LobbyModule {}