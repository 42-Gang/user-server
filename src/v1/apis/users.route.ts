import { FastifyInstance } from 'fastify';

import { addRoutes, Route } from '../../plugins/router.js';
import UsersController from './users.controller.js';
import { createUserInputSchema, createUserResponseSchema } from './schemas/createUser.schema.js';
import { getUserParamsSchema, getUserResponseSchema } from './schemas/getUser.schema.js';
import {
  editNicknameInputSchema,
  editNicknameResponseSchema,
} from './schemas/editNickname.schema.js';
import { searchUserParamsSchema, searchUserResponseSchema } from './schemas/searchUser.schema.js';
import {
  authenticateUserInputSchema,
  authenticateUserResponseSchema,
} from './schemas/authenticateUser.schema.js';

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
          description: '회원 등록',
          body: createUserInputSchema,
          response: {
            201: createUserResponseSchema,
          },
        },
        auth: false,
      },
    },
    {
      method: 'POST',
      url: '/authenticate',
      handler: usersController.authenticateUser,
      options: {
        schema: {
          tags: ['users'],
          description: 'ID / PW 인증',
          body: authenticateUserInputSchema,
          response: {
            200: authenticateUserResponseSchema,
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
          description: '유저 정보 조회',
          params: getUserParamsSchema,
          response: {
            200: getUserResponseSchema,
          },
        },
        auth: true,
      },
    },
    {
      method: 'PATCH',
      url: '/me',
      handler: usersController.editNickname,
      options: {
        schema: {
          tags: ['users'],
          description: '내 정보 수정',
          body: editNicknameInputSchema,
          response: {
            200: editNicknameResponseSchema,
          },
        },
        auth: true,
      },
    },
    {
      method: 'GET',
      url: '/search/:nickname',
      handler: usersController.searchUser,
      options: {
        schema: {
          tags: ['users'],
          description: '유저 검색',
          params: searchUserParamsSchema,
          response: {
            200: searchUserResponseSchema,
          },
        },
        auth: true,
      },
    },
  ];
  await addRoutes(fastify, routes);
}
