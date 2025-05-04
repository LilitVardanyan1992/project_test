import { Controller, Get, Query } from '@nestjs/common';
import { RowsService } from './rows.service';

@Controller('rows')
export class RowsController {
  constructor(private readonly rowsService: RowsService) {}

  @Get('grouped-by-date')
  async getGroupedByDate(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ): Promise<{
    data: { date: string; items: any[] }[];
    meta: { total: number; page: number; lastPage: number };
  }> {
    return this.rowsService.getGroupedByDate(+page, +limit);
  }
}
