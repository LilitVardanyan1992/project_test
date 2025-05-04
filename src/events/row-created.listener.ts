import { OnEvent } from '@nestjs/event-emitter';
import { Injectable, Inject } from '@nestjs/common';
import { RowsEntity } from '../row/rows.entity';
import { Server } from 'socket.io';

@Injectable()
export class RowCreatedListener {
  constructor(@Inject('SOCKET_IO_SERVER') private readonly io: Server) {}

  @OnEvent('row.created')
  handleRowCreated(payload: RowsEntity) {
    this.io.emit('row.created', payload);
  }
}
