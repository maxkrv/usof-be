import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({
    minLength: 6,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({
    minLength: 6,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  repeatPassword: string;

  @IsString()
  @IsNotEmpty()
  token: string;
}

export class EmailDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
