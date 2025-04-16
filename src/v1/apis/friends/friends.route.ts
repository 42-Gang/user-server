import { FastifyInstance } from 'fastify';
import { addRoutes, Route } from '../../../plugins/router.js';
import FriendsController from './friends.controller.js';
import {
  friendRequestSchema,
  friendResponseSchema,
  updateFriendParamsSchema,
} from './friends.schema.js';

export default async function friendsRoutes(fastify: FastifyInstance) {
  const friendsController: FriendsController = fastify.diContainer.resolve('friendsController');

  const routes: Array<Route> = [
    {
      method: 'POST',
      url: '/requests',
      handler: friendsController.request,
      options: {
        schema: {
          tags: ['friends'],
          description: '친구 요청',
          body: friendRequestSchema,
          response: {
            201: friendResponseSchema,
          },
        },
        auth: true,
      },
    },
    {
      method: 'PATCH',
      url: '/requests/:id/accept',
      handler: friendsController.acceptRequest,
      options: {
        schema: {
          tags: ['friends'],
          description: '친구요청 수락',
          params: updateFriendParamsSchema,
          response: {
            200: friendResponseSchema,
          },
        },
        auth: true,
      },
    },
    {
      method: 'PATCH',
      url: '/requests/:id/reject',
      handler: friendsController.rejectRequest,
      options: {
        schema: {
          tags: ['friends'],
          description: '친구요청 거절',
          params: updateFriendParamsSchema,
          response: {
            200: friendResponseSchema,
          },
        },
        auth: true,
      },
    },
    {
      method: 'PATCH',
      url: '/:id/block',
      handler: friendsController.blockUser,
      options: {
        schema: {
          tags: ['friends'],
          description: '친구 차단',
          params: updateFriendParamsSchema,
          response: {
            200: friendResponseSchema,
          },
        },
        auth: true,
      },
    },
    {
      method: 'PATCH',
      url: '/:id/unblock',
      handler: friendsController.unblockUser,
      options: {
        schema: {
          tags: ['friends'],
          description: '친구 차단해제',
          params: updateFriendParamsSchema,
          response: {
            200: friendResponseSchema,
          },
        },
        auth: true,
      },
    },
    {
      method: 'GET',
      url: '/',
      handler: friendsController.getFriends,
      options: {
        schema: {
          tags: ['friends'],
          description: '친구 리스트',
          response: {
            200: friendResponseSchema,
          },
        },
        auth: true,
      },
    },
  ];

  await addRoutes(fastify, routes);
}
