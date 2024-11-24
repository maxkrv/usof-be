import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PostService } from './post.service';
import { GetPostsDto } from './dto/get-posts.dto';
import { GetCurrentUserId } from 'src/shared/decorators/get-current-user-id.decorator';
import { Public } from 'src/shared/decorators/public.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Public()
  @Get()
  async getPosts(
    @Query() dto: GetPostsDto,
    @GetCurrentUserId() userId: number,
  ) {
    return this.postService.findAll(userId, dto);
  }

  @Public()
  @Get('favorites')
  async getFavoritePosts(
    @GetCurrentUserId() userId: number,
    @Query() dto: GetPostsDto,
  ) {
    if (!userId) return [];

    return this.postService.findFavorites(userId, dto, true);
  }

  @Post('favorites/:id')
  async setFavorite(
    @GetCurrentUserId() userId: number,
    @Param('id') postId: number,
  ) {
    return this.postService.setFavorite(userId, postId);
  }

  @Delete('favorites/:id')
  async removeFavorite(
    @GetCurrentUserId() userId: number,
    @Param('id') postId: number,
  ) {
    return this.postService.removeFavorite(userId, postId);
  }

  @Get('me')
  async getMyPosts(
    @Query() dto: GetPostsDto,
    @GetCurrentUserId() userId: number,
  ) {
    return this.postService.findAll(userId, dto, true);
  }

  @Public()
  @Get(':id')
  async getById(@Param('id') id: number, @GetCurrentUserId() userId: number) {
    if (!id) throw new HttpException('Post not found', 404);

    const post = await this.postService.findById(id, userId);

    if (!post) {
      throw new HttpException('Post not found', 404);
    }

    return post;
  }

  @Post()
  async create(@Body() dto: CreatePostDto, @GetCurrentUserId() userId: number) {
    return this.postService.create(dto, userId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdatePostDto,
    @GetCurrentUserId() userId: number,
  ) {
    return this.postService.update(id, dto, userId);
  }

  @Delete(':id')
  async delete(@Param('id') id: number, @GetCurrentUserId() userId: number) {
    return this.postService.delete(id, userId);
  }
}
