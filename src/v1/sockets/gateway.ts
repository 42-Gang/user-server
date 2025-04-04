import { Server } from 'socket.io';
import statusNamespace from './status/status.namespace.js';

export const registerSocketGateway = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('🟢 [default] Client connected:', socket.id);
    socket.on('disconnect', () => {
      console.log('🔴 [default] Client disconnected:', socket.id);
    });
  });

  statusNamespace(io.of('/status'));
};
