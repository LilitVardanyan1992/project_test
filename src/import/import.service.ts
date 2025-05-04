import { Injectable, Logger } from '@nestjs/common';
import { ParserService } from '../parser/parser.service';
import { RedisService } from '../redis/redis.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly parserService: ParserService,
  ) {}

  async startImport(
    file: Express.Multer.File,
    uploadDir: string,
    jobId: string,
    importJobTimeout: number,
  ) {
    const filePath = path.resolve(file.path);
    const statusKey = `import:job:${jobId}:status`;

    const initialStatus = {
      status: 'pending',
      file: {
        name: file.originalname,
        size: file.size,
        path: filePath,
      },
      createdAt: new Date().toISOString(),
    };

    await Promise.all([
      this.redisService.setObject(statusKey, initialStatus),
      this.redisService.sadd('import:status:pending', jobId),
      this.redisService.expire(statusKey, importJobTimeout),
    ]);

    setImmediate(async () => {
      try {
        const processingStatus = {
          status: 'processing',
          file: initialStatus.file,
          startedAt: new Date().toISOString(),
        };

        await Promise.all([
          this.redisService.setObject(statusKey, processingStatus),
          this.redisService.srem('import:status:pending', jobId),
          this.redisService.sadd('import:status:processing', jobId),
        ]);

        const result = await this.parserService.parseExcelStream(
          filePath,
          jobId,
          (progress) => {
            this.redisService.setObject(
              `import:job:${jobId}:progress`,
              progress,
            );
          },
        );

        const newStatus = {
          ...processingStatus,
          results: {
            totalProcessed: result.processedCount,
            validRows: result.validCount,
            errorCount: result.errorCount,
          },
          completedAt: new Date().toISOString(),
        };

        const finalStatus = result.cancelled ? 'cancelled' : 'completed';
        newStatus.status = finalStatus;

        await Promise.all([
          this.redisService.setObject(statusKey, newStatus),
          this.redisService.srem('import:status:processing', jobId),
          this.redisService.sadd(`import:status:${finalStatus}`, jobId),
        ]);
      } catch (error) {
        this.logger.error(`Import job ${jobId} failed`, error.stack);

        await Promise.all([
          this.redisService.setObject(statusKey, {
            status: 'failed',
            file: initialStatus.file,
            error: {
              message: error.message,
              stack:
                process.env.NODE_ENV === 'development'
                  ? error.stack
                  : undefined,
            },
            failedAt: new Date().toISOString(),
          }),
          this.redisService.srem('import:status:processing', jobId),
          this.redisService.sadd('import:status:failed', jobId),
        ]);
      } finally {
        fs.unlink(filePath, (err) => {
          if (err) this.logger.error('Failed to delete temp file:', err);
        });
      }
    });

    return {
      jobId,
      message: 'Import job created successfully',
      statusEndpoint: `/import/status/${jobId}`,
    };
  }
}
