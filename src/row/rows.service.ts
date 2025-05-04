import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RowsEntity } from './rows.entity';
import { Repository } from 'typeorm';
import { CreateRowDto } from './dto/create-row.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class RowsService {
  constructor(
    @InjectRepository(RowsEntity)
    private readonly rowRepository: Repository<RowsEntity>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async saveMany(rows: CreateRowDto[]): Promise<void> {
    const saves = await this.rowRepository.save(rows);
    this.eventEmitter.emit('row.created', saves);
  }

  async saveRow(data: CreateRowDto) {
    const entity = this.rowRepository.create({
      externalId: data.externalId,
      name: data.name,
      date: data.date,
    });

    const saved = await this.rowRepository.save(entity);
    this.eventEmitter.emit('row.created', saved);
    return saved;
  }

  async getGroupedByDate(
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    data: { date: string; items: RowsEntity[] }[];
    meta: { total: number; page: number; lastPage: number };
  }> {
    const datesQuery = await this.rowRepository
      .createQueryBuilder('row')
      .select([
        "TO_CHAR(row.date, 'YYYY-MM-DD') AS date",
        'COUNT(row.id) AS count',
      ])
      .groupBy("TO_CHAR(row.date, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC');

    const totalDatesCount = await datesQuery.getCount();

    const dates = await datesQuery
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany();

    if (dates.length === 0) {
      return {
        data: [],
        meta: {
          total: totalDatesCount,
          page,
          lastPage: Math.ceil(totalDatesCount / limit),
        },
      };
    }

    const dateStrings = dates.map((d) => d.date);

    const rows = await this.rowRepository
      .createQueryBuilder('row')
      .select([
        'row.id AS id',
        'row.name AS name',
        'row.date AS rawDate',
        "TO_CHAR(row.date, 'YYYY-MM-DD') AS date",
      ])
      .where(`TO_CHAR(row.date, 'YYYY-MM-DD') IN (:...dates)`, {
        dates: dateStrings,
      })
      .orderBy('date', 'ASC')
      .addOrderBy('row.id', 'ASC')
      .getRawMany();

    const groupedData = [];
    const groupMap = new Map<string, RowsEntity[]>();

    for (const row of rows) {
      if (!groupMap.has(row.date)) {
        groupMap.set(row.date, []);
      }

      groupMap.get(row.date).push({
        id: row.id,
        name: row.name,
        date: row.rawDate,
      } as RowsEntity);
    }

    for (const dateString of dateStrings) {
      groupedData.push({
        date: dateString,
        items: groupMap.get(dateString) || [],
      });
    }

    return {
      data: groupedData,
      meta: {
        total: totalDatesCount,
        page,
        lastPage: Math.ceil(totalDatesCount / limit),
      },
    };
  }
}
