import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Badge } from './badge.entity';
import { UserBadge } from './user-badge.entity';
import { BadgesService } from './badges.service';

@Module({
  imports: [TypeOrmModule.forFeature([Badge, UserBadge])],
  providers: [BadgesService],
  exports: [TypeOrmModule, BadgesService], // Diğer modüllerin bu repository'leri kullanabilmesi için
})
export class BadgesModule {}

