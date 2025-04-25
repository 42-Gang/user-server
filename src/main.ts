import { createServer, startServer } from './server-utils.js';
import { configureServer, registerPlugins, setupGracefulShutdown } from './server-config.js';
import { createSocketServer } from './plugins/socket.js';
import { asClass, asFunction, Lifetime } from 'awilix';
import { startConsumer } from './v1/kafka/consumer.js';

async function init() {
  const server = createServer();

  await configureServer(server); // 서버 설정
  await registerPlugins(server); // 플러그인 등록
  const socket = createSocketServer(server);

  await server.ready(); // 플러그인 로딩 완료 대기
  await startServer(server); // 서버 시작

  await server.diContainer.loadModules(['./**/src/**/*.topic.handler.ts'], {
    esModules: true,
    formatName: 'camelCase',
    resolverOptions: {
      lifetime: Lifetime.SINGLETON,
      register: asClass,
      injectionMode: 'CLASSIC',
    },
  });
  server.diContainer.register({
    kafkaConsumer: asFunction(startConsumer, {
      lifetime: Lifetime.SINGLETON,
      injectionMode: 'CLASSIC',
    }),
  });
  (async () => {
    await server.diContainer.resolve('kafkaConsumer');
  })();

  await setupGracefulShutdown(server, socket); // 서버 종료 시그널 핸들러 등록
}

init();
