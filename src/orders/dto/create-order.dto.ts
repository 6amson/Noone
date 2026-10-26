import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class OrderItemDto {
  @ApiProperty({ example: 'Chocolate Box' })
  @IsString()
  packageName: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 25000 })
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'hr@acme.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  customerEmail: string;

  @ApiProperty({ example: '+234 800 000 0000', description: 'Phone number for the delivery contact' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  recipientPhone: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ example: 'Team appreciation for Q4', required: false })
  @IsOptional()
  @IsString()
  occasion?: string;

  @ApiProperty({ example: 20, required: false })
  @IsOptional()
  @IsNumber()
  recipientCount?: number;

  @ApiProperty({ example: 'Victoria Island office', required: false })
  @IsOptional()
  @IsString()
  deliveryArea?: string;

  @ApiProperty({ example: 'Please include a note for the HR manager', required: false })
  @IsOptional()
  @IsString()
  customerNote?: string;

  @ApiProperty({
    example: '2026-10-25',
    description: 'Requested delivery date (YYYY-MM-DD). Cutoff rules may adjust this.',
    required: false,
  })
  @IsOptional()
  @IsString()
  requestedDeliveryDate?: string;
}
