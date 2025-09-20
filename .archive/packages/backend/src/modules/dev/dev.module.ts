import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../../entities/role.entity';
import { User } from '../../entities/user.entity';
import { DevSeederService } from './dev-seeder.service';

@Module({
  imports: [TypeOrmModule.forFeature([Role, User])],
  providers: [DevSeederService],
  exports: [DevSeederService],
})
export class DevModule {}

