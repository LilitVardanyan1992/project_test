import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as path from 'path';
import { AppModule } from '../../app.module';

describe('ImportController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/import (POST) - should upload and process a valid file', async () => {
    const testFilePath = path.join(__dirname, 'fixtures', 'valid.xlsx');

    const res = await request(app.getHttpServer())
      .post('/import')
      .attach('file', testFilePath);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('jobId');
    expect(res.body).toHaveProperty('statusEndpoint');
  });

  it('/import (POST) - should reject invalid file extension', async () => {
    const testFilePath = path.join(__dirname, 'fixtures', 'invalid.txt');

    const res = await request(app.getHttpServer())
      .post('/import')
      .attach('file', testFilePath);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Only Excel files');
  });

  it('/import/status/:jobId (GET) - should return 404 for nonexistent job', async () => {
    const res = await request(app.getHttpServer()).get(
      '/import/status/fake-id',
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('Import job fake-id not found');
  });
});
