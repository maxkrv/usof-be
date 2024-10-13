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
  @IsEnum(['createdAt', 'rating', 'comments'])
  orderBy: 'createdAt' | 'rating' | 'comments';

  constructor(dto: Partial<GetPostsDto>) {
    Object.assign(this, dto);

    this.limit = this.limit || 10;
    this.page = this.page || 1;
    this.order = this.order || 'desc';
    this.orderBy = this.orderBy || 'createdAt';
  }
}
