import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { RedisService } from '../redis/redis.service';
import { ValidationService } from '../validation/validation.service';
import { RowsService } from '../row/rows.service';

@Injectable()
export class ParserService {
  private readonly BATCH_SIZE = 1000;

  constructor(
    private readonly redisService: RedisService,
    private readonly validationService: ValidationService,
    private readonly rowsService: RowsService,
  ) {}

  async parseExcelStream(
    filePath: string,
    jobId: string,
    onProgressUpdate?: (progress: {
      processed: number;
      valid: number;
      errors: number;
    }) => void,
  ): Promise<{
    processedCount: number;
    validCount: number;
    errorCount: number;
    cancelled: boolean;
  }> {
    const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
      sharedStrings: 'cache',
      styles: 'cache',
      worksheets: 'emit',
    });



    let processed = 0;
    let valid = 0;
    let error = 0;
    let validBuffer = [];
    const errorList: string[] = [];

    for await (const worksheet of workbookReader) {
      for await (const row of worksheet) {
        if (row.number === 1) continue; // Skip header

        const abortKey = `import:job:${jobId}:abort`;
        const abort = await this.redisService.get(abortKey);
        if (abort === '1') {
          return {
            processedCount: processed,
            validCount: valid,
            errorCount: error,
            cancelled: true,
          };
        }

        processed++;

        const raw = {
          id: row.getCell(1).value,
          name: row.getCell(2).value,
          date: row.getCell(3).value,
        };

        const { isValid, errors, parsedRow } =
          this.validationService.validateRow(raw);

        if (isValid && parsedRow) {
          validBuffer.push({
            externalId: parsedRow.id,
            name: parsedRow.name,
            date: parsedRow.date,
          });
          valid++;
        } else {
          const errMessage = `${row.number} - ${errors.join(', ')}`;
          errorList.push(errMessage);
          error++;
          await this.redisService.lpush(
            `import:job:${jobId}:errors`,
            JSON.stringify({ row: row.number, errors }),
          );
        }

        if (validBuffer.length >= this.BATCH_SIZE) {
          await this.rowsService.saveMany(validBuffer);
          validBuffer = [];
        }

        if (processed % 100 === 0 && onProgressUpdate) {
          onProgressUpdate({ processed, valid, errors: error });
        }
      }
    }

    if (validBuffer.length > 0) {
      await this.rowsService.saveMany(validBuffer);
    }

    if (onProgressUpdate) {
      onProgressUpdate({ processed, valid, errors: error });
    }

    if (errorList.length > 0) {
      const file = `result-${jobId}.txt`;
      fs.writeFileSync(path.resolve(file), errorList.join('\n'), 'utf-8');
    }

    return {
      processedCount: processed,
      validCount: valid,
      errorCount: error,
      cancelled: false,
    };
  }
}
