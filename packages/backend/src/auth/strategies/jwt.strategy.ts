import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

export interface JwtPayload {
  sub: string;
  email: string;
  roleId: number;
  roleName: string;
  iat: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    try {
      // Verify user still exists and is active
      const user = await this.authService.getUserProfile(payload.sub);

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Return user object that will be attached to request
      return {
        userId: user.id,
        email: user.email,
        roleId: user.roleId,
        roleName: user.role.name,
        user: user, // Full user object for detailed operations
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}