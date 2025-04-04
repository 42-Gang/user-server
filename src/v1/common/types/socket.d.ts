import 'socket.io';
import { FastifyBaseLogger } from 'fastify';

declare module 'socket.io' {
  interface Server {
    logger: FastifyBaseLogger;
    data: {
      userId: number;
    };
  }
}
