import { Module } from '@nestjs/common';
import { EditorialsController } from './editorials.controller';
import { EditorialsService } from './editorials.service';

@Module({
  controllers: [EditorialsController],
  providers: [EditorialsService],
  exports: [EditorialsService],
})
export class EditorialsModule {}
