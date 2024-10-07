import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DbService } from 'src/shared/services/db.service';
import { FileUploadService } from 'src/shared/services/file-upload.service';

@Module({
  controllers: [UserController],
  providers: [DbService, FileUploadService, UserService],
  exports: [UserService],
})
export class UserModule {}
