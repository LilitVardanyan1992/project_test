import { Global, Module } from '@nestjs/common';
import { Server } from 'socket.io';

@Global()
@Module({
  providers: [
    {
      provide: 'SOCKET_IO_SERVER',
      useFactory: () => {
        const io = new Server({
          cors: {
            origin: '*',
          },
        });

        io.listen(6001);
        return io;
      },
    },
  ],
  exports: ['SOCKET_IO_SERVER'],
})
export class SocketModule {}
