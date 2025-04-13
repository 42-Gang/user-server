import { FastifyReply, FastifyRequest } from 'fastify';
import FriendsService from './friends.service.js';
import { friendRequestSchema, updateFriendParamsSchema } from './friends.schema.js';

export default class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  request = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = friendRequestSchema.parse(request.body);
    const result = await this.friendsService.request(request.userId, body.friendId);
    reply.status(201).send(result);
  };

  acceptRequest = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = updateFriendParamsSchema.parse(request.params);
    const result = await this.friendsService.accept(request.userId, params.id);
    reply.status(200).send(result);
  };

  rejectRequest = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = updateFriendParamsSchema.parse(request.params);
    const result = await this.friendsService.reject(request.userId, params.id);
    reply.status(200).send(result);
  };

  blockUser = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = updateFriendParamsSchema.parse(request.params);
    const result = await this.friendsService.block(request.userId, params.id);
    reply.status(200).send(result);
  };

  unblockUser = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = updateFriendParamsSchema.parse(request.params);
    const result = await this.friendsService.unblock(request.userId, params.id);
    reply.status(200).send(result);
  };

  // getFriends = async (request: FastifyRequest, reply: FastifyReply) => {
  //   const result = await this.friendsService.getFriends(request.userId);
  //   reply.status(200).send(result);
  // };
}
