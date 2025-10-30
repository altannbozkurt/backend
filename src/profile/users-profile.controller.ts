// src/profile/users-profile.controller.ts

import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProfileService } from './profile.service';

@Controller('users')
export class UsersProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // GET /users/:id/profile
  @Get(':id/profile')
  @UseGuards(AuthGuard('jwt'))
  async getUserProfileById(@Param('id') id: string) {
    // ID ile kullanıcı + playerProfile getir
    return this.profileService.getFullUserProfileById(id);
  }
}
