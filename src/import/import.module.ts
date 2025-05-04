import { Module } from '@nestjs/common';
import { ImportController } from './import.controller';
import { ParserModule } from '../parser/parser.module';
import { RedisModule } from '../redis/redis.module';
import { ImportService } from './import.service';

@Module({
  imports: [ParserModule, RedisModule],
  providers: [ImportService],
  controllers: [ImportController],
  exports: [ImportService],
})
export class ImportModule {}
