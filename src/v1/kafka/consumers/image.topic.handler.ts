import { TypeOf } from 'zod';
import { KafkaTopicHandler } from './kafka.topic.handler.js';
import { IMAGE_EVENTS, TOPICS } from '../constants.js';
import { NotFoundException } from '../../common/exceptions/core.error.js';
import UserRepositoryInterface from '../../storage/database/interfaces/user.repository.interface.js';
import { avatarUpdateSchema } from '../schemas/image-topic.schema.js';

export default class ImageTopicHandler implements KafkaTopicHandler {
  public readonly topic = TOPICS.IMAGE;
  public readonly fromBeginning = false;

  constructor(private readonly userRepository: UserRepositoryInterface) {}

  async handle(messageValue: string): Promise<void> {
    const parsedMessage = JSON.parse(messageValue);

    if (parsedMessage.eventType == IMAGE_EVENTS.UPLOADED) {
      const data = avatarUpdateSchema.parse(parsedMessage);
      await this.handleAvatarUpdate(data);
    }
  }

  async handleAvatarUpdate(message: TypeOf<typeof avatarUpdateSchema>) {
    // 사용자 avatarUrl 업데이트
    const { userId, avatarUrl } = message;
    console.log(message);
    const user = await this.userRepository.update(userId, { avatarUrl });
    if (!user) {
      throw new NotFoundException('사용자 정보를 업데이트할 수 없습니다.');
    }
    console.log(`✅ Avatar updated for user ${userId}: ${avatarUrl}`);
    /* 알림 전송- 필요 시 사용
    this.statusNamespace.to(`user:${userId}`).emit('user-avatar-updated', { avatarUrl });
    */
  }
}
