import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevSeederService } from './dev-seeder.service';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  providers: [DevSeederService],
  exports: [DevSeederService],
})
export class DevModule {}