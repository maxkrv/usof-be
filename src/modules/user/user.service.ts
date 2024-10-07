import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DbService } from 'src/shared/services/db.service';
import { FileUploadService } from 'src/shared/services/file-upload.service';

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

  async findById(id: number, select?: Prisma.UserSelect) {
    return this.dbService.user.findUnique({ where: { id }, select });
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
