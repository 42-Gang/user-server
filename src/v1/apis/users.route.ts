import { FastifyInstance } from 'fastify';

import { addRoutes, Route } from '../../plugins/router.js';
import UsersController from './users.controller.js';
import { getUserParamsSchema } from './users.schema.js';

export default async function usersRoutes(fastify: FastifyInstance) {
  const usersController: UsersController = fastify.diContainer.resolve('usersController');
  const routes: Array<Route> = [
    {
      method: 'POST',
      url: '/',
      handler: usersController.createUser,
      options: {
        schema: {
          tags: ['users'],
        },
        auth: false,
      },
    },
    {
      method: 'GET',
      url: '/:id',
      handler: usersController.getUser,
      options: {
        schema: {
          tags: ['users'],
          params: getUserParamsSchema,
        },
        auth: true,
      },
    },
  ];
  await addRoutes(fastify, routes);
}
