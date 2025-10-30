// src/auth/dto/login-user.dto.ts

import { IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class LoginUserDto {
  
  @IsPhoneNumber('US') // ABD telefon numarası formatı
  @IsNotEmpty()
  phone_number: string;
}