import { FastifyInstance } from 'fastify';

import { addRoutes, Route } from '../../../plugins/router.js';
import UsersController from './users.controller.js';
import { createUserInputSchema, createUserResponseSchema } from './schemas/create-user.schema.js';
import { getUserParamsSchema, getUserResponseSchema } from './schemas/get-user.schema.js';
import {
  editNicknameInputSchema,
  editNicknameResponseSchema,
} from './schemas/edit-nickname.schema.js';
import {
  searchUserParamsSchema,
  searchUserQuerySchema,
  searchUserResponseSchema,
} from './schemas/search-user.schema.js';
import {
  authenticateUserInputSchema,
  authenticateUserResponseSchema,
} from './schemas/authenticate-user.schema.js';
import { coreResponseSchema } from '../../common/schema/core.schema.js';
import { checkDuplicatedEmailParamsSchema } from './schemas/check-duplicated-email.schema.js';
import { getProfileResponseSchema } from './schemas/get-profile.schema.js';
import { uploadAvatarResponseSchema } from './schemas/upload-avatar.schema.js';
import {
  oauthUserExistsInputSchema,
  oauthUserExistsResponseSchema,
} from './schemas/check-oauth-user-existence.schema.js';
import {
  createOauthUserInputSchema,
  createOauthUserResponseSchema,
} from './schemas/oauth-create-user.schema.js';

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
        internalOnly: true,
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
        internalOnly: true,
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
          querystring: searchUserQuerySchema,
          response: {
            200: searchUserResponseSchema,
          },
        },
        auth: true,
      },
    },
    {
      method: 'GET',
      url: '/check-email/:email',
      handler: usersController.checkDuplicatedEmail,
      options: {
        schema: {
          tags: ['users'],
          description: '이메일 중복 체크',
          params: checkDuplicatedEmailParamsSchema,
          response: {
            200: coreResponseSchema,
          },
        },
        auth: false,
        internalOnly: true,
      },
    },
    {
      method: 'GET',
      url: '/me',
      handler: usersController.getMyProfile,
      options: {
        schema: {
          tags: ['users'],
          description: '내 정보 확인',
          response: {
            200: getProfileResponseSchema,
          },
        },
        auth: true,
      },
    },
    {
      method: 'POST',
      url: '/avatar',
      handler: usersController.uploadAvatar,
      options: {
        schema: {
          tags: ['users'],
          description: '아바타 업로드',
          response: {
            200: uploadAvatarResponseSchema,
          },
        },
      },
    },
    {
      method: 'DELETE',
      url: '/avatar',
      handler: usersController.deleteAvatar,
      options: {
        schema: {
          tags: ['users'],
          description: '아바타 삭제',
          response: {
            200: coreResponseSchema,
          },
        },
        auth: true,
      },
    },
    {
      method: 'POST',
      url: '/oauth',
      handler: usersController.createOAuthUser,
      options: {
        schema: {
          tags: ['users'],
          description: 'OAuth 유저 생성',
          body: createOauthUserInputSchema,
          response: {
            201: createOauthUserResponseSchema,
          },
        },
        auth: false,
      },
    },
    {
      method: 'POST',
      url: '/oauth/existence',
      handler: usersController.checkOAuthUserExistence,
      options: {
        schema: {
          tags: ['users'],
          description: 'OAuth 메일 중복 여부 확인',
          body: oauthUserExistsInputSchema,
          response: {
            200: oauthUserExistsResponseSchema,
          },
        },
        auth: false,
      },
    },
  ];
  await addRoutes(fastify, routes);
}
