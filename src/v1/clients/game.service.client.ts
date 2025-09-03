import { GotClient } from '../../plugins/http.client.js';
import { z } from 'zod';

enum GameMode {
  DUEL = 'DUEL',
  TOURNAMENT = 'TOURNAMENT',
}

export enum TournamentResultEnum {
  WIN = 'WIN',
  LOSS = 'LOSS',
}

export const ZTournamentHistoryItem = z.object({
  tournamentId: z.number().int().positive(),
  rounds: z.number().int().positive(),
  participants: z
    .array(
      z.object({
        id: z.number().int().nonnegative(),
        nickname: z.string().min(1),
      }),
    )
    .min(1),
  myResult: z.nativeEnum(TournamentResultEnum),
});

export const ZDuelHistoryItem = z.object({
  date: z.string().datetime(),
  player1: z.object({
    id: z.number().int().nonnegative(),
    nickname: z.string().min(1),
  }),
  player2: z.object({
    id: z.number().int().nonnegative(),
    nickname: z.string().min(1),
  }),
  result: z.object({
    winnerId: z.number().int().nonnegative(),
    scores: z.object({
      player1: z.number().int().min(0),
      player2: z.number().int().min(0),
    }),
  }),
});

export const ZTournamentData = z.object({
  summary: z.object({
    wins: z.number().int().min(0),
    losses: z.number().int().min(0),
  }),
  history: z.array(ZTournamentHistoryItem),
});

export const ZDuelData = z.object({
  summary: z.object({
    wins: z.number().int().min(0),
    losses: z.number().int().min(0),
  }),
  history: z.array(ZDuelHistoryItem),
});

export default class GameServiceClient {
  constructor(
    private readonly httpClient: GotClient,
    private readonly gameServerUrl: string,
  ) {
    if (!gameServerUrl) {
      throw new Error('gameServerUrl is required and must be a non-empty string');
    }
  }

  private getStats(userId: number, mode: GameMode) {
    return this.httpClient.requestJson<{
      message: string;
      data: object;
    }>({
      url: `http://${this.gameServerUrl}/api/v1/game/stats/${userId}`,
      queryParams: {
        mode,
      },
      method: 'GET',
      headers: {
        'x-internal': 'true',
        'x-authenticated': 'true',
        'x-user-id': userId.toString(),
      },
    });
  }

  async getDuelStats(userId: number): Promise<z.infer<typeof ZDuelData>> {
    const response = await this.getStats(userId, GameMode.DUEL);

    if (response.statusCode !== 200) {
      throw new Error(`Failed to fetch duel stats: ${response.statusCode}`);
    }

    return ZDuelData.parse(response.body.data);
  }

  async getTournamentStats(userId: number): Promise<z.infer<typeof ZTournamentData>> {
    const response = await this.getStats(userId, GameMode.TOURNAMENT);

    if (response.statusCode !== 200) {
      throw new Error(`Failed to fetch duel stats: ${response.statusCode}`);
    }

    return ZTournamentData.parse(response.body.data);
  }
}
