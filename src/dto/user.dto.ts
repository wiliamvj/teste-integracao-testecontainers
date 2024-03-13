import { OmitType, PartialType } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @IsNotEmpty()
  last_name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(30)
  @IsNotEmpty()
  password: string;
}

export class UserIdParamDto {
  @IsNotEmpty()
  @IsUUID()
  id: string;
}

export class UserUpdateDto extends PartialType(
  OmitType(UserDto, ['password']),
) {}
