import { Optional } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsPositive } from 'class-validator';

export class GetCommentDto {
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
  @IsEnum(['createdAt', 'rating'])
  orderBy: 'createdAt' | 'rating';

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  postId: number;

  constructor(dto: Partial<GetCommentDto>) {
    Object.assign(this, dto);

    this.limit = this.limit || 10;
    this.page = this.page || 1;
    this.order = this.order || 'desc';
    this.orderBy = this.orderBy || 'rating';
  }
}
