import { Module } from '@nestjs/common';
import { RowCreatedListener } from './row-created.listener';

@Module({
  providers: [RowCreatedListener],
})
export class EventsModule {}
