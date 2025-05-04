import { RowsService } from '../rows.service';
import { RowsEntity } from '../rows.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('RowsService', () => {
  let service: RowsService;
  let repo: Repository<RowsEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RowsService,
        {
          provide: getRepositoryToken(RowsEntity),
          useValue: {
            create: jest.fn().mockImplementation((dto) => dto),
            save: jest.fn().mockResolvedValue({ id: 1, ...mockRow }),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RowsService>(RowsService);
    repo = module.get<Repository<RowsEntity>>(getRepositoryToken(RowsEntity));
  });

  const mockRow = {
    externalId: 123,
    name: 'Test User',
    date: new Date('1990-01-01'),
  };

  it('should save row and return saved entity', async () => {
    const result = await service.saveRow(mockRow);

    expect(repo.create).toBeCalledWith(mockRow);
    expect(repo.save).toBeCalledWith(mockRow);
    expect(result.id).toBe(1);
  });
});
