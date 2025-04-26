import { Server } from 'socket.io';
import startStatusNamespace from './status/start-status-namespace.js';
import { socketMiddleware } from './utils/middleware.js';
import { asValue, AwilixContainer } from 'awilix';

export const registerSocketGateway = (diContainer: AwilixContainer, io: Server) => {
  io.use(socketMiddleware);

  const statusNamespace = io.of('/status');

  diContainer.register({
    statusNamespace: asValue(statusNamespace),
  });

  startStatusNamespace(statusNamespace);
};
