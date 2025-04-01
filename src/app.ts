import { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import routeV1 from './v1/index.js';
import { STATUS } from './v1/common/constants/status.js';
import { UnAuthorizedException } from './v1/common/exceptions/core.error.js';

export default async function app(fastify: FastifyInstance) {
  setErrorHandler(fastify);
  setDecorate(fastify);
  setMiddleware(fastify);

  fastify.register(routeV1, { prefix: '/v1' });
}

function setErrorHandler(fastify: FastifyInstance) {
  fastify.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    fastify.log.error(error);
    const statusCode: number = error.statusCode || 500;
    reply.code(statusCode).send({
      status: STATUS.ERROR,
      message: error.message,
    });
  });
}

function setMiddleware(fastify: FastifyInstance) {
  fastify.addHook('onRequest', (request, reply, done) => {
    const authorized = request.headers['x-authorized'];
    const userId = request.headers['x-user-id'];
    
    if (authorized === undefined || Array.isArray(authorized)) {
      done();
    }
    if (userId === undefined || Array.isArray(userId)) {
      done();
    }
    if (isNaN(Number(userId)) === true) {
      throw new UnAuthorizedException('user id is not a number');
    }

    if (authorized === 'true') {
      request.authorized = true;
      request.myId = parseInt(userId as string , 10);
    }
    done();
  });
}

function setDecorate(fastify: FastifyInstance) {
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log(request.authorized);
    if (!request.authorized) {
      reply.code(401).send({
        status: STATUS.ERROR,
        message: 'Unauthorized',
      });
    }
  });
}
