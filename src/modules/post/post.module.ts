import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { DbService } from 'src/shared/services/db.service';

@Module({
  controllers: [PostController],
  providers: [DbService, PostService],
  exports: [PostService],
})
export class PostModule {}
