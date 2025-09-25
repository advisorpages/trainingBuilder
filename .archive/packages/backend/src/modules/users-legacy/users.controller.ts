import { Controller, Get, Param, Patch, Body, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../common/guards/roles.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Get('status')
  getUsersStatus(): object {
    return this.usersService.getStatus();
  }

  @Roles(UserRole.CONTENT_DEVELOPER)
  @Get()
  async getAllUsers() {
    return this.usersService.findAll();
  }

  @Get('profile')
  async getCurrentUserProfile(@CurrentUser() user: any) {
    return this.usersService.findOne(user.userId);
  }

  @Roles(UserRole.CONTENT_DEVELOPER)
  @Get('roles')
  async getAllRoles() {
    return this.usersService.getAllRoles();
  }

  @Roles(UserRole.CONTENT_DEVELOPER)
  @Get('by-role/:roleName')
  async getUsersByRole(@Param('roleName') roleName: string) {
    return this.usersService.getUsersByRole(roleName);
  }

  @Get(':id')
  async getUserById(@Param('id') id: string, @CurrentUser() currentUser: any) {
    // Users can view their own profile, Content Developers can view any profile
    if (String(currentUser.userId) === id || currentUser.roleName === UserRole.CONTENT_DEVELOPER) {
      return this.usersService.findOne(id);
    }
    throw new ForbiddenException('Access denied');
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.CONTENT_DEVELOPER)
  async deactivateUser(@Param('id') id: string) {
    return this.usersService.deactivateUser(id);
  }

  @Patch(':id/activate')
  @Roles(UserRole.CONTENT_DEVELOPER)
  async activateUser(@Param('id') id: string) {
    return this.usersService.activateUser(id);
  }
}