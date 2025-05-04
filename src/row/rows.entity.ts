import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('rows')
export class RowsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', nullable: false })
  externalId: number;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'timestamp', nullable: false })
  date: Date;
}
