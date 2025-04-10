import { FastifyInstance } from 'fastify';

import usersRoutes from './apis/users/users.route.js';
import friendsRoutes from './apis/friends/friends.route.js';

export default async function routeV1(fastify: FastifyInstance) {
  fastify.register(usersRoutes, { prefix: '/users' });
  fastify.register(friendsRoutes, { prefix: '/friends' });
}
