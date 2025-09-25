import { IsNotEmpty, IsEmail, IsOptional, MaxLength } from 'class-validator';

export class CreateRegistrationDto {
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(255, { message: 'Name must be less than 255 characters' })
  name: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @MaxLength(255, { message: 'Email must be less than 255 characters' })
  email: string;

  @IsOptional()
  @MaxLength(255, { message: 'Referred by must be less than 255 characters' })
  referredBy?: string;
}