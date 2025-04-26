import { Namespace } from 'socket.io';
import { socketMiddleware } from '../utils/middleware.js';

export default async function startFriendNamespace(namespace: Namespace) {
  namespace.use(socketMiddleware);
}
