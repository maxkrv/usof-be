import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsPositive, IsOptional } from 'class-validator';

export class GetPostsDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  limit: number;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  page: number;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order: 'asc' | 'desc';

  @IsOptional()
  @IsEnum(['createdAt', 'rating', 'comments'])
  orderBy: 'createdAt' | 'rating' | 'comments';

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  categoryId?: number;

  constructor(dto: Partial<GetPostsDto>) {
    Object.assign(this, dto);

    this.limit = this.limit || 10;
    this.page = this.page || 1;
    this.order = this.order || 'desc';
    this.orderBy = this.orderBy || 'createdAt';
    this.categoryId = this.categoryId || undefined;
  }
}
