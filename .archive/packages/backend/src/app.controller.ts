import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';
import { Roles } from './common/decorators/roles.decorator';
import { UserRole } from './common/guards/roles.guard';
import { CurrentUser } from './common/decorators/current-user.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('health')
  async getHealth(): Promise<object> {
    return await this.appService.getHealth();
  }

  @Public()
  @Get()
  async getInfo(): Promise<object> {
    return await this.appService.getAppInfo();
  }

  @Roles(UserRole.CONTENT_DEVELOPER)
  @Get('database-status')
  async getDatabaseStatus(): Promise<object> {
    return await this.appService.getDatabaseStatus();
  }

  @Roles(UserRole.CONTENT_DEVELOPER)
  @Get('relationship-tests')
  async getRelationshipTests(): Promise<object> {
    return await this.appService.getRelationshipTests();
  }

  @Get('protected')
  async getProtectedInfo(@CurrentUser() user: any): Promise<object> {
    return {
      message: 'This is a protected endpoint',
      user: {
        id: user.userId,
        email: user.email,
        role: user.roleName,
      },
      timestamp: new Date().toISOString(),
    };
  }
}