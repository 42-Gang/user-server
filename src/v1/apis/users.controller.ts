import { FastifyReply, FastifyRequest } from 'fastify';

import UsersService from './users.service.js';
import { createUserInputSchema, getUserParamsSchema } from './users.schema.js';

export default class UsersController {
  constructor(private readonly usersService: UsersService) {}

  createUser = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createUserInputSchema.parse(request.body);
    const result = await this.usersService.createUser(body);
    reply.code(201).send(result);
  };

  getUser = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = getUserParamsSchema.parse(request.params);
    const result = await this.usersService.getUser(params.id);
    reply.code(200).send(result);
  };
}
