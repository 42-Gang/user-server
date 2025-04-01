import 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    headers: {
      'X-Authorized': string | undefined | string[];
      'X-User-Id': string | undefined;
    };

    authorized: boolean;
    myId?: number;
  }
}
