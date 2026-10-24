import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ConfirmOrderDto {
  @ApiProperty({
    example: 'PSK_test_ref_123',
    description: 'Payment reference from Paystack',
  })
  @IsString()
  paymentReference: string;
}
