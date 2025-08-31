import { FastifyInstance } from 'fastify';

import usersRoutes from './apis/users/users.route.js';
import friendsRoutes from './apis/friends/friends.route.js';
import { context, trace } from '@opentelemetry/api';

export default async function routeV1(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request, _) => {
    const span = trace.getSpan(context.active());
    if (!span) return;

    span.updateName(`${request.method} ${request.url}`);
  });

  fastify.register(usersRoutes, { prefix: '/users' });
  fastify.register(friendsRoutes, { prefix: '/friends' });
}
