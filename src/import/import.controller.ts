import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { ImportService } from './import.service';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

@Controller('import')
export class ImportController {
  constructor(
    private readonly configService: ConfigService,
    private readonly importService: ImportService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = path.resolve('./uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const jobId = uuidv4();
          req.body.jobId = jobId;
          const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
          cb(null, `${jobId}-${cleanName}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(xlsx|xls)$/i)) {
          return cb(
            new BadRequestException('Only Excel files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async importFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const jobId = file.filename.split('-')[0];
    const uploadDir = path.resolve('./uploads');
    const importJobTimeout = this.configService.get(
      'IMPORT_JOB_TIMEOUT',
      86400,
    );

    return this.importService.startImport(
      file,
      uploadDir,
      jobId,
      importJobTimeout,
    );
  }
}
