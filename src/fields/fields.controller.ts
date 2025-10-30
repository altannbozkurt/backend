// src/fields/fields.controller.ts

import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FieldsService } from './fields.service';
import { CreateFieldDto } from './dto/create-field.dto';
import { GetNearbyFieldsDto } from './dto/get-nearby-fields.dto';
import { AuthGuard } from '@nestjs/passport'; // KORUMA GÖREVLİMİZ
import { Request } from 'express';

@Controller('fields') // Bu controller /fields yolunu dinler
@UseGuards(AuthGuard('jwt')) // DİKKAT: Tüm /fields endpoint'lerini koru!
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  /**
   * YENİ BİR HALI SAHA OLUŞTURUR
   * POST /fields
   */
  @Post()
  createField(
    @Body() createFieldDto: CreateFieldDto,
    // @Req() req: Request, // İleride "sahayı kim ekledi"
    // const user = req.user; // diye loglamak istersek kullanabiliriz.
  ) {
    // Gelen DTO'yu doğrula ve servise pasla
    return this.fieldsService.createField(createFieldDto);
  }

  /**
   * YAKINDAKİ HALI SAHALARI LİSTELER
   * GET /fields/nearby?latitude=40.71&longitude=-74.00&radius=10000
   */
  @Get('nearby')
  findNearbyFields(@Query() query: GetNearbyFieldsDto) {
    
    // Gelen query parametrelerini (latitude, longitude, radius)
    // doğrula ve servise pasla
    return this.fieldsService.findNearbyFields(
      query.latitude,
      query.longitude,
      query.radius,
    );
  }
}