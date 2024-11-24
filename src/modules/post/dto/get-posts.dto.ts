import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsPositive, IsOptional, IsDate } from 'class-validator';

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

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  userId?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fromDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  toDate?: Date;

  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';

  constructor(dto: Partial<GetPostsDto>) {
    Object.assign(this, dto);

    this.limit = this.limit || 10;
    this.page = this.page || 1;
    this.order = this.order || 'desc';
    this.orderBy = this.orderBy || 'rating';
    this.categoryId = this.categoryId || undefined;
  }
}
