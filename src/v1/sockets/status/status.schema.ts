import { z } from 'zod';

export enum userStatus {
  'ONLINE' = 'ONLINE',
  'OFFLINE' = 'OFFLINE',
  'GAME' = 'GAME',
  'AWAY' = 'AWAY',
  'LOBBY' = 'LOBBY',
}

export const userStatusSchema = z.object({
  userId: z.number(),
  status: z.nativeEnum(userStatus),
});
