import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DbService } from 'src/shared/services/db.service';
import { FileUploadService } from 'src/shared/services/file-upload.service';
import { MeUserResponse, UserResponse } from './interface/user.interface';

@Injectable()
export class UserService {
  constructor(
    private readonly dbService: DbService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async findOne(data: Prisma.UserWhereInput, select?: Prisma.UserSelect) {
    return this.dbService.user.findFirst({
      where: data,
      select,
    });
  }

  async findById(
    id: number,
    isMe = false,
  ): Promise<UserResponse | MeUserResponse> {
    try {
      const user = await this.dbService.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new HttpException('User not found', 404);
      }

      if (isMe) {
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt,
          rating: user.rating,
          isActive: user.isActive,
          fullName: user.fullName,
        } satisfies MeUserResponse;
      } else {
        return {
          id: user.id,
          username: user.username,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt,
          rating: user.rating,
        } satisfies UserResponse;
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new HttpException('User not found', 404);
        }
      }

      throw error;
    }
  }

  async findAll() {
    return this.dbService.user.findMany();
  }

  async create(user: Prisma.UserCreateInput) {
    return this.dbService.user.create({ data: user });
  }

  async update(
    id: number,
    user: Prisma.UserUpdateInput,
    select?: Prisma.UserSelect,
  ) {
    return this.dbService.user.update({ where: { id }, data: user, select });
  }

  async updateAvatar(id: number, avatar: Express.Multer.File) {
    const { Location } = await this.fileUploadService.uploadFile(avatar);

    return this.update(
      id,
      { profilePicture: Location },
      { profilePicture: true },
    );
  }
}
