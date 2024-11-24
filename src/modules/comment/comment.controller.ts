import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { Public } from 'src/shared/decorators/public.decorator';
import { GetCurrentUserId } from 'src/shared/decorators/get-current-user-id.decorator';
import { GetCommentDto } from './dto/get-comment-dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Public()
  @Get()
  async getComments(
    @Query() dto: GetCommentDto,
    @GetCurrentUserId() userId: number,
  ) {
    return this.commentService.getAll(dto, userId);
  }

  @Post()
  async create(
    @GetCurrentUserId() userId: number,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentService.create(userId, dto);
  }

  @Patch(':id')
  async update(@Param('id') id: number, @Body() dto: UpdateCommentDto) {
    if (!id) {
      throw new NotFoundException();
    }

    return this.commentService.update(id, dto);
  }

  @Delete(':id')
  async delete(@GetCurrentUserId() userId: number, @Param('id') id: number) {
    return this.commentService.delete(userId, id);
  }
}
