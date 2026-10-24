import { ApiProperty } from '@nestjs/swagger';

export class ReceiptDataDto {
  @ApiProperty({ example: 'NOO-1001' })
  orderId: string;

  @ApiProperty({ enum: ['paid'], example: 'paid' })
  status: 'paid';

  @ApiProperty({ example: 67500, description: 'Amount received (NGN)' })
  amountReceived: number;

  @ApiProperty({ example: 'PSK_test_ref_123' })
  paymentReference: string;

  @ApiProperty({ example: '2026-10-24T09:00:00.000Z' })
  paidAt: string;

  @ApiProperty({ example: 62500, description: 'Balance due before dispatch (NGN)' })
  balanceRemaining: number;
}
