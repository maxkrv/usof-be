import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { ReactionService } from './reaction.service';
import { IdDto, LikeDto } from './dto/create-like.dto';
import { GetCurrentUserId } from 'src/shared/decorators/get-current-user-id.decorator';

@Controller('reaction')
export class ReactionController {
  constructor(private readonly reactionService: ReactionService) {}

  @Post('post/:id')
  async createPostReaction(
    @Param() { id }: IdDto,
    @Body() dto: LikeDto,
    @GetCurrentUserId() userId: number,
  ) {
    return this.reactionService.create(userId, id, dto, true);
  }

  @Post('comment/:id')
  async createCommentReaction(
    @Param() { id }: IdDto,
    @Body() dto: LikeDto,
    @GetCurrentUserId() userId: number,
  ) {
    return this.reactionService.create(userId, id, dto, false);
  }

  @Delete('post/:id')
  async deletePostReaction(
    @Param() { id }: IdDto,
    @GetCurrentUserId() userId: number,
  ) {
    return this.reactionService.delete(userId, id, true);
  }

  @Delete('comment/:id')
  async deleteCommentReaction(
    @Param() { id }: IdDto,
    @GetCurrentUserId() userId: number,
  ) {
    return this.reactionService.delete(userId, id, false);
  }
}
