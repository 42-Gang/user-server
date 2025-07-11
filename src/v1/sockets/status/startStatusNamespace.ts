import { Namespace } from 'socket.io';
import { socketMiddleware } from '../utils/middleware.js';
import { handleConnection } from './connection.handler.js';

export default async function startStatusNamespace(namespace: Namespace) {
  namespace.use(socketMiddleware);

  // const friendCacheRepository = namespace.server.diContainer.resolve('friendCacheRepository');
  const statusService = namespace.server.diContainer.resolve('statusService');

  namespace.on('connection', (socket) => handleConnection(socket, namespace, statusService));
}
