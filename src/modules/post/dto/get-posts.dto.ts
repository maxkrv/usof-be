import { Optional } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsPositive } from 'class-validator';

export class GetPostsDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  limit: number;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  page: number;

  @Optional()
  @IsEnum(['asc', 'desc'])
  order: 'asc' | 'desc';

  @Optional()
  @IsEnum(['createdAt', 'likes', 'comments'])
  orderBy: 'createdAt' | 'likes' | 'comments';

  constructor(dto: Partial<GetPostsDto>) {
    Object.assign(this, dto);

    this.limit = this.limit || 10;
    this.page = this.page || 1;
    this.order = this.order || 'asc';
    this.orderBy = this.orderBy || 'createdAt';
  }
}
