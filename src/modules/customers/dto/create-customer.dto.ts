import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: '5439856234562345' })
  @IsOptional()
  @IsMongoId()
  parent_customer_id?: string;
}
