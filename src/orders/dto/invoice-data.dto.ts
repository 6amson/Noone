import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../types/order.types';

export class OrderItemResponseDto {
  @ApiProperty({ example: 'Chocolate Box' })
  packageName: string;

  @ApiProperty({ example: 5 })
  quantity: number;

  @ApiProperty({ example: 25000 })
  unitPrice: number;

  @ApiProperty({ example: 125000 })
  lineTotal: number;
}

export class InvoiceDataDto {
  @ApiProperty({ example: 'NOO-1001' })
  orderId: string;

  @ApiProperty({ enum: ['pending', 'paid'], example: 'pending' })
  status: OrderStatus;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty({ example: 125000, description: 'Sum of all line totals (NGN)' })
  subtotal: number;

  @ApiProperty({ example: 5000, description: 'Delivery fee (NGN)' })
  deliveryFee: number;

  @ApiProperty({
    example: 62500,
    description: 'Deposit due now for orders >= NGN 150,000; otherwise equals subtotal',
  })
  depositRequired: number;

  @ApiProperty({ example: 67500, description: 'Deposit plus delivery fee (NGN)' })
  totalDueNow: number;

  @ApiProperty({ example: 62500, description: 'Balance due before dispatch (NGN)' })
  balanceRemaining: number;

  @ApiProperty({ example: 'https://paystack.com/pay/noone-test-noo-1001' })
  paymentLink: string;

  @ApiProperty({ example: '2026-10-25' })
  deliveryDate: string;

  @ApiProperty({ example: '50% deposit required; balance due before dispatch' })
  notes: string;
}
