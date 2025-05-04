import { ParserService } from '../parser.service';
import { ValidationService } from '../../validation/validation.service';
import { RowsService } from '../../row/rows.service';
import { RedisService } from '../../redis/redis.service';

describe('ParserService', () => {
  let parserService: ParserService;
  let mockValidationService: Partial<ValidationService>;
  let mockRowsService: Partial<RowsService>;
  let mockRedisService: Partial<RedisService>;

  beforeEach(() => {
    mockValidationService = {
      validateRow: jest.fn().mockReturnValue({
        isValid: true,
        errors: [],
        parsedRow: {
          id: 123,
          name: 'John Doe',
          date: new Date('2000-01-01'),
        },
      }),
    };

    mockRowsService = {
      saveMany: jest.fn().mockResolvedValue(undefined),
    };

    mockRedisService = {
      setProgress: jest.fn().mockResolvedValue(undefined),
    };

    parserService = new ParserService(
      mockRedisService as RedisService,
      mockValidationService as ValidationService,
      mockRowsService as RowsService,
    );
  });

  it('should save valid rows and update progress', async () => {
    const validRows = [
      {
        id: 123,
        name: 'John Doe',
        date: new Date('2000-01-01'),
      },
      {
        id: 456,
        name: 'Jane Smith',
        date: new Date('1999-12-31'),
      },
    ];

    for (const row of validRows) {
      (mockValidationService.validateRow as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
        parsedRow: row,
      });

      parserService['rowsService'].saveMany?.([
        {
          externalId: row.id,
          name: row.name,
          date: row.date,
        },
      ]);
    }

    expect(mockRowsService.saveMany).toHaveBeenCalled();
    expect(mockRedisService.setProgress).not.toThrow();
  });
});
