import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SeedController } from './seed.controller';

@Module({
  controllers: [AdminController, SeedController],
  providers: [AdminService],
})
export class AdminModule {}
