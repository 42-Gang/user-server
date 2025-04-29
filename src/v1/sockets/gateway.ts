import { Server } from 'socket.io';
import startStatusNamespace from './status/startStatusNamespace.js';
import { socketMiddleware } from './utils/middleware.js';
import { asValue, AwilixContainer } from 'awilix';
import startFriendNamespace from './friend/startFriendNamespace.js';

export const registerSocketGateway = (diContainer: AwilixContainer, io: Server) => {
  io.use(socketMiddleware);

  const statusNamespace = io.of('/status');
  const friendNamespace = io.of('/friend');

  diContainer.register({
    statusNamespace: asValue(statusNamespace),
    friendNamespace: asValue(friendNamespace),
  });

  startStatusNamespace(statusNamespace);
  startFriendNamespace(friendNamespace);
};
