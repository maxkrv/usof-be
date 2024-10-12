import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Patch,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { GetCurrentUserId } from 'src/shared/decorators/get-current-user-id.decorator';
import { AllowNotActivated } from 'src/shared/decorators/allow-not-activated.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  UploadFileSizeValidator,
  UploadFileTypeValidator,
} from 'src/shared/validators';
import {
  IMG_ALLOWED_TYPES,
  IMG_MAX_SIZE,
} from 'src/shared/constants/constants';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @AllowNotActivated()
  @Get('me')
  async me(@GetCurrentUserId() userId: number) {
    return this.userService.findById(userId, true);
  }

  @AllowNotActivated()
  @Get(':id')
  async getById(@Param('id') id: number) {
    if (!id) throw new HttpException('User not found', 404);

    return this.userService.findById(id);
  }

  @Patch()
  async update(@GetCurrentUserId() userId: number, @Body() dto: UpdateUserDto) {
    await this.userService.update(userId, dto);

    return {
      success: true,
    };
  }

  @Patch('/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateAvatar(
    @GetCurrentUserId() userId: number,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addValidator(
          new UploadFileTypeValidator({ fileType: IMG_ALLOWED_TYPES }),
        )
        .addValidator(new UploadFileSizeValidator({ maxSize: IMG_MAX_SIZE }))
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          fileIsRequired: true,
        }),
    )
    avatar: Express.Multer.File,
  ) {
    return this.userService.updateAvatar(userId, avatar);
  }
}
