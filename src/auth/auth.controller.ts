// src/auth/auth.controller.ts

import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto'; // <-- Login DTO'yu import et

@Controller('auth') // Bu controller /auth yolunu dinler
export class AuthController {
  
  constructor(private readonly authService: AuthService) {}

  // POST /auth/register yoluna gelen istekleri dinler
  @Post('register')
  register(@Body() registerUserDto: RegisterUserDto) {
    
    // @Body() ile isteğin "body" kısmındaki JSON'u alıp
    // RegisterUserDto şablonumuza göre doğrular (Adım 25-26 sayesinde)
    // ve authService'teki register fonksiyonuna paslar.
    return this.authService.register(registerUserDto);
  }

// --- YENİ LOGIN ENDPOINT'İMİZ ---
  @Post('login')
  // Giriş başarılı olduğunda 201 (Created) yerine 200 (OK) dönmesini sağlıyoruz
  @HttpCode(HttpStatus.OK) 
  login(@Body() loginUserDto: LoginUserDto) {
    // Gelen body'yi LoginUserDto'ya göre doğrula
    // ve authService'teki login fonksiyonuna pasla.
    return this.authService.login(loginUserDto);
  }
}