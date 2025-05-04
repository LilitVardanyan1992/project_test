import { Test, TestingModule } from '@nestjs/testing';
import { RowsController } from '../rows.controller';
import { RowsService } from '../rows.service';

describe('RowsController', () => {
  let controller: RowsController;
  let rowsService: RowsService;

  const mockRowsService = {
    getGroupedByDate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RowsController],
      providers: [
        {
          provide: RowsService,
          useValue: mockRowsService,
        },
      ],
    }).compile();

    controller = module.get<RowsController>(RowsController);
    rowsService = module.get<RowsService>(RowsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return grouped rows by date', async () => {
    const mockResult = {
      data: [
        {
          date: '2025-05-01',
          items: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
          ],
        },
      ],
      meta: { total: 1, page: 1, lastPage: 1 },
    };

    mockRowsService.getGroupedByDate.mockResolvedValue(mockResult);

    const result = await controller.getGroupedByDate(1, 50);

    expect(rowsService.getGroupedByDate).toHaveBeenCalledWith(1, 50);
    expect(result).toEqual(mockResult);
  });
});
