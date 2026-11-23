import { ApiProperty } from '@nestjs/swagger';

export class ReportResponseDto {
  @ApiProperty({ example: '64b8f0c2e1f2a3b4c5d6e7f8' })
  customer_id!: string;

  @ApiProperty({ example: 2 })
  total_indications!: number;
}
