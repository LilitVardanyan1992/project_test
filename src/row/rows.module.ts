import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RowsEntity } from './rows.entity';
import { RowsService } from './rows.service';
import { EventsModule } from '../events/events.module';
import { RowsController } from './rows.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RowsEntity]), EventsModule],
  providers: [RowsService],
  exports: [RowsService],
  controllers: [RowsController],
})
export class RowsModule {}
