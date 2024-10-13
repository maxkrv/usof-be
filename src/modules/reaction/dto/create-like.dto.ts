import { ReactionType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsPositive } from 'class-validator';

export class LikeDto {
  @IsNotEmpty()
  @IsEnum(['LIKE', 'DISLIKE'])
  type: ReactionType;
}

// Tech debt: move to shared
export class IdDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  id: number;
}
