import { Server } from 'socket.io';
import { FastifyInstance } from 'fastify';
import { registerSocketGateway } from '../v1/sockets/gateway.js';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';

export function createSocketServer(fastify: FastifyInstance) {
  const socket = new Server(fastify.server, {
    cors: {
      origin: '*',
    },
  });
  socket.logger = fastify.log;

  const pubClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  });
  const subClient = pubClient.duplicate();

  socket.adapter(createAdapter(pubClient, subClient));

  registerSocketGateway(socket);
  return socket;
}
