import { Server } from 'socket.io';
import statusNamespace from './status/status.namespace.js';
import { socketMiddleware } from './utils/middleware.js';

export const registerSocketGateway = (io: Server) => {
  io.use(socketMiddleware);
  statusNamespace(io.of('/status'));
};
