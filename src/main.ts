import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // <-- 1. BUNU İÇERİ AKTAR

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Gelen tüm API isteklerini otomatik olarak doğrula
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // DTO'da olmayan verileri otomatik olarak at
    forbidNonWhitelisted: true, // DTO'da olmayan veri gelirse hata ver
    transform: true, // Gelen veriyi otomatik olarak DTO tipine dönüştür
  })); // <-- 2. BU BLOĞU EKLE
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
