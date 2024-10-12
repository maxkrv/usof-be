import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { DbService } from 'src/shared/services/db.service';

@Module({
  controllers: [CommentController],
  providers: [DbService, CommentService],
  exports: [CommentService],
})
export class CommentModule {}
