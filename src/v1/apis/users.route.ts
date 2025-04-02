import { FastifyInstance } from 'fastify';

import { addRoutes, Route } from '../../plugins/router.js';
import UsersController from './users.controller.js';
import {
  createUserInputSchema,
  createUserResponseSchema,
  getUserParamsSchema,
  getUserResponseSchema,
} from './users.schema.js';

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
          body: createUserInputSchema,
          response: {
            201: createUserResponseSchema,
          },
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
          response: {
            200: getUserResponseSchema,
          },
        },
        auth: true,
      },
    },
  ];
  await addRoutes(fastify, routes);
}
