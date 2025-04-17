import { RouteShorthandOptions, RouteHandlerMethod } from 'fastify';
import { FastifyInstance } from 'fastify/types/instance.js';
import { STATUS } from '../v1/common/constants/status.js';

// 권한 필요 여부를 표현할 때 추가 옵션 타입 확장
interface RouteOptions extends RouteShorthandOptions {
  auth?: boolean; // 권한 필요 여부 (옵셔널)
  internal?: boolean; // 내부 API 여부 (옵셔널)
  description?: string; // 설명 (옵셔널)
}

export interface Route {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  handler: RouteHandlerMethod;
  options: RouteOptions;
}

export async function addRoutes(fastify: FastifyInstance, routes: Route[]) {
  routes.forEach((route) => {
    if (route.options.internal === true) {
      fastify.route({
        method: route.method,
        url: route.url,
        handler: route.handler,
        schema: route.options.schema,
        onRequest: (request, reply, done) => {
          if (request.internal == false) {
            return reply.status(403).send({
              status: STATUS.ERROR,
              message: 'Forbidden',
            });
          }
          done();
        },
      });
      return;
    }

    if (route.options.auth === false) {
      fastify.route({
        method: route.method,
        url: route.url,
        handler: route.handler,
        schema: route.options.schema,
      });
      return;
    }

    fastify.route({
      method: route.method,
      url: route.url,
      handler: route.handler,
      schema: route.options.schema,
      onRequest: fastify.authenticate,
    });
  });
}
