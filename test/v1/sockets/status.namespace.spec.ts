import { it, expect } from 'vitest';
import { io } from 'socket.io-client';

it('WebSocket 연결 후 인증 테스트', async (done) => {
  const socket = io('http://localhost:3000/status', {
    auth: { token: 'test-jwt-token' },
  });

  socket.on('connect', () => {
    console.log('✅ WebSocket 연결됨');
  });

  socket.on('authenticated', () => {
    try {
      expect(true).toBe(true); // ✅ 테스트 조건
      done(); // ❗ 테스트 완료 알리기
    } catch (err) {
      done(err); // ❗ 실패 시 Vitest에게 알려주기
    } finally {
      socket.disconnect();
    }
  });

  socket.on('connect_error', (err) => {
    console.error('❌ WebSocket 연결 실패:', err);
    done(err); // 연결 실패도 테스트 실패로 처리
  });
});
