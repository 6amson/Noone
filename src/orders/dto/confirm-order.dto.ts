import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ConfirmOrderDto {
  @ApiProperty({
    example: 'PSK_test_ref_123',
    description: 'Payment reference from Paystack (or mock)',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentReference?: string;
}
