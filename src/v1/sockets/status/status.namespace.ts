import { Namespace } from 'socket.io';
import { socketMiddleware } from '../utils/middleware.js';
import { startConsumer } from './kafka/consumer.js';
import { handleConnection } from './connection.handler.js';

export default async function statusNamespace(namespace: Namespace) {
  namespace.use(socketMiddleware);

  const friendCacheRepository = namespace.server.diContainer.resolve('friendCacheRepository');
  const statusService = namespace.server.diContainer.resolve('statusService');

  startConsumer(namespace, friendCacheRepository);
  namespace.on('connection', (socket) => handleConnection(socket, namespace, statusService));
}
