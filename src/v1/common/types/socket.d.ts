import 'socket.io';
import { FastifyBaseLogger } from 'fastify';
import { RedisClient } from 'ioredis/built/connectors/SentinelConnector/types.js';

declare module 'socket.io' {
  interface Server {
    logger: FastifyBaseLogger;
    data: {
      userId: number;
    };
    redis: RedisClient;
  }

  interface Server {
    redis: RedisClient;
  }
}
