import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async current() {
    // Placeholder until auth wiring is reintroduced
    return {
      email: 'placeholder@example.com',
      role: 'content_developer',
    };
  }
}
