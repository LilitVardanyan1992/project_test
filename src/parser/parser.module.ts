import { Module } from '@nestjs/common';
import { ParserService } from './parser.service';
import { ValidationModule } from '../validation/validation.module';
import { RowsModule } from '../row/rows.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [ValidationModule, RowsModule, RedisModule],
  providers: [ParserService],
  exports: [ParserService],
})
export class ParserModule {}
