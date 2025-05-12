import {
  ConflictException,
  NotFoundException,
  UnAuthorizedException,
} from '../../common/exceptions/core.error.js';
import { TypeOf } from 'zod';
import { STATUS } from '../../common/constants/status.js';
import UserRepositoryInterface from '../../storage/database/interfaces/user.repository.interface.js';
import bcrypt from 'bcrypt';
import { createUserInputSchema, createUserResponseSchema } from './schemas/create-user.schema.js';
import { getUserResponseSchema } from './schemas/get-user.schema.js';
import {
  editNicknameInputSchema,
  editNicknameResponseSchema,
} from './schemas/edit-nickname.schema.js';
import {
  authenticateUserInputSchema,
  authenticateUserResponseSchema,
} from './schemas/authenticate-user.schema.js';
import { getProfileSchema, getProfileResponseSchema } from './schemas/get-profile.schema.js';
import { Status } from '@prisma/client';
import { searchUserQuerySchema, searchUserResponseSchema } from './schemas/search-user.schema.js';
import FileService from '../file/file.service.js';
import { MultipartFile } from '@fastify/multipart';
import { uploadAvatarResponseSchema } from './schemas/upload-avatar.schema.js';

export default class UsersService {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly crypt: typeof bcrypt,
    private readonly fileService: FileService,
  ) {}

  async createUser(
    body: TypeOf<typeof createUserInputSchema>,
  ): Promise<TypeOf<typeof createUserResponseSchema>> {
    if (await this.userRepository.findByEmail(body.email)) {
      throw new ConflictException('이미 가입한 이메일입니다.');
    }

    if (await this.userRepository.findByNickname(body.nickname)) {
      throw new ConflictException('닉네임은 중복될 수 없습니다.');
    }

    const passwordHash = await this.crypt.hash(body.password, 10);
    const user = await this.userRepository.create({
      nickname: body.nickname,
      email: body.email,
      passwordHash: passwordHash,
      avatarUrl: 'avatars-default.png',
    });

    return {
      status: STATUS.SUCCESS,
      data: user,
    };
  }

  async authenticateUser(
    body: TypeOf<typeof authenticateUserInputSchema>,
  ): Promise<TypeOf<typeof authenticateUserResponseSchema>> {
    const user = await this.userRepository.findByEmail(body.email);

    if (!user || user.passwordHash === null) {
      throw new UnAuthorizedException('이메일 혹은 비밀번호를 잘못 입력하셨습니다.');
    }

    const passwordValidation = await this.crypt.compare(body.password, user.passwordHash);
    if (!passwordValidation) {
      throw new UnAuthorizedException('이메일 혹은 비밀번호를 잘못 입력하셨습니다.');
    }

    return {
      status: STATUS.SUCCESS,
      message: '로그인 성공',
      data: {
        userId: user.id,
      },
    };
  }

  async getUser(id: number): Promise<TypeOf<typeof getUserResponseSchema>> {
    const user = await this.getProfileData(id);

    return {
      status: STATUS.SUCCESS,
      data: user,
    };
  }

  async editNickname(
    id: number,
    body: TypeOf<typeof editNicknameInputSchema>,
  ): Promise<TypeOf<typeof editNicknameResponseSchema>> {
    const user = await this.userRepository.update(id, body);
    if (!user) {
      throw new NotFoundException('사용자 정보를 업데이트할 수 없습니다.');
    }

    return {
      status: STATUS.SUCCESS,
      data: user,
    };
  }

  async uploadAvatarImage(
    userId: number,
    file: MultipartFile,
  ): Promise<TypeOf<typeof uploadAvatarResponseSchema>> {
    const url = await this.fileService.upload(file, 'aoeifjoaewi.png');
    return {
      status: STATUS.SUCCESS,
      data: {
        url,
      },
    };
  }

  async searchUser({
    userId,
    query: { status, exceptMe },
    nickname,
  }: {
    userId: number;
    query: TypeOf<typeof searchUserQuerySchema>;
    nickname: string;
  }): Promise<TypeOf<typeof searchUserResponseSchema>> {
    // all: status가 없으면 전체조회, noneFlag: status 배열에 'NONE' 포함 여부
    const all = status === undefined;
    const noneFlag = status?.includes('NONE') ?? false;
    // 실제 사용 가능한 status만 필터
    const realStatuses = status?.filter((s) => s !== 'NONE') as Status[] | undefined;

    const foundUsers = await this.userRepository.findByNicknameStartsWith({
      nickname,
      userId,
      exceptMe,
      all,
      noneFlag,
      statuses: realStatuses,
    });

    const users = await Promise.all(
      foundUsers.map(async (user) => {
        const avatarUrl = await this.fileService.getUrl(user.avatarUrl);
        return {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          avatarUrl,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
      }),
    );

    return {
      status: STATUS.SUCCESS,
      data: {
        users,
      },
    };
  }

  async checkDuplicatedEmail(email: string): Promise<boolean> {
    const foundEmail = await this.userRepository.findByEmail(email);
    if (foundEmail) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }

    return true;
  }

  async getMyProfile(userId: number): Promise<TypeOf<typeof getProfileResponseSchema>> {
    const user = await this.getProfileData(userId);
    if (userId !== user.id) {
      throw new UnAuthorizedException('본인만 접근할 수 있습니다.');
    }

    return {
      status: STATUS.SUCCESS,
      message: '프로필을 성공적으로 불러왔습니다.',
      data: user,
    };
  }

  private async getProfileData(id: number): Promise<TypeOf<typeof getProfileSchema>> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`유저 ID ${id}를 찾을 수 없습니다`);
    }
    const avatarUrl = await this.fileService.getUrl(user.avatarUrl);

    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatarUrl,
    };
  }
}
