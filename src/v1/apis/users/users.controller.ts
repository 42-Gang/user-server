import { FastifyReply, FastifyRequest } from 'fastify';

import UsersService from './users.service.js';
import { createUserInputSchema } from './schemas/create-user.schema.js';
import { getUserParamsSchema, getUserResponseSchema } from './schemas/get-user.schema.js';
import { editNicknameInputSchema } from './schemas/edit-nickname.schema.js';
import { searchUserParamsSchema, searchUserQuerySchema } from './schemas/search-user.schema.js';
import { authenticateUserInputSchema } from './schemas/authenticate-user.schema.js';
import { checkDuplicatedEmailParamsSchema } from './schemas/check-duplicated-email.schema.js';
import { STATUS } from '../../common/constants/status.js';
import { BadRequestException } from '../../common/exceptions/core.error.js';
import { createOauthUserInputSchema } from './schemas/oauth-create-user.schema.js';
import { oauthUserExistsInputSchema } from './schemas/check-oauth-user-existence.schema.js';

export default class UsersController {
  constructor(private readonly usersService: UsersService) {}

  createUser = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createUserInputSchema.parse(request.body);
    const result = await this.usersService.createUser(body);
    reply.code(201).send(result);
  };

  authenticateUser = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = authenticateUserInputSchema.parse(request.body);
    const result = await this.usersService.authenticateUser(body);
    reply.code(200).send(result);
  };

  getUser = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = getUserParamsSchema.parse(request.params);
    const result = await this.usersService.getUser(params.id);
    getUserResponseSchema.parse(result);
    reply.code(200).send(result);
  };

  editNickname = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = editNicknameInputSchema.parse(request.body);
    const result = await this.usersService.editNickname(request.userId, body);
    reply.code(200).send(result);
  };

  searchUser = async (request: FastifyRequest, reply: FastifyReply) => {
    const query = searchUserQuerySchema.parse(request.query);
    const params = searchUserParamsSchema.parse(request.params);
    const result = await this.usersService.searchUser({
      userId: request.userId,
      query,
      nickname: params.nickname,
    });
    reply.code(200).send(result);
  };

  checkDuplicatedEmail = async (request: FastifyRequest, reply: FastifyReply) => {
    request.log.info(request.params, 'checkDuplicatedEmail');
    const params = checkDuplicatedEmailParamsSchema.parse(request.params);
    request.log.info(params, 'checkDuplicatedEmail');
    await this.usersService.checkDuplicatedEmail(params.email);
    reply.code(200).send({
      status: STATUS.SUCCESS,
      message: '이메일이 중복되지 않았습니다.',
    });
  };

  getMyProfile = async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await this.usersService.getMyProfile(request.userId);
    reply.status(200).send(result);
  };

  uploadAvatar = async (request: FastifyRequest, reply: FastifyReply) => {
    const file = await request.file();
    if (!file) {
      throw new BadRequestException('파일이 업로드되지 않았습니다.');
    }

    const result = await this.usersService.uploadAvatarImage(request.userId, file);
    reply.status(200).send(result);
  };

  deleteAvatar = async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await this.usersService.deleteAvatarImage(request.userId);
    reply.status(200).send(result);
  };

  createOAuthUser = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createOauthUserInputSchema.parse(request.body);
    const result = await this.usersService.createOAuthUser(body.email, body.nickname);
    reply.status(201).send(result);
  };

  checkOAuthUserExistence = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = oauthUserExistsInputSchema.parse(request.body);
    const result = await this.usersService.checkOAuthUserExistence(body.email);
    reply.status(200).send(result);
  };
}
