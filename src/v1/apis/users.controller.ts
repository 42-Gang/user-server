import { FastifyReply, FastifyRequest } from 'fastify';

import UsersService from './users.service.js';
import { getUserParamsSchema } from './users.schema.js';

export default class UsersController {
  constructor(private readonly usersService: UsersService) {}

  getUser = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = getUserParamsSchema.parse(request.params);
    const result = await this.usersService.getUser(params.id);
    reply.code(200).send(result);
  };
}
