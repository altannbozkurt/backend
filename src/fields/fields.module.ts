// src/fields/fields.module.ts

import { Module } from '@nestjs/common';
import { FieldsController } from './fields.controller';
import { FieldsService } from './fields.service';
import { AuthModule } from '../auth/auth.module'; // <-- GÜVENLİK İÇİN
import { TypeOrmModule } from '@nestjs/typeorm';
import { Field } from './field.entity'; // <-- VERİTABANI İÇİN

@Module({
  imports: [
    AuthModule, // <-- Korumalı endpoint'ler için
    TypeOrmModule.forFeature([Field]), // <-- Field tablosunu kullan
  ],
  controllers: [FieldsController],
  providers: [FieldsService],
})
export class FieldsModule {}