import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { InvoiceData, ReceiptData } from './types/order.types';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a pending order and return invoice data' })
  @ApiResponse({ status: 201, description: 'Invoice data with payment link' })
  create(@Body() dto: CreateOrderDto): InvoiceData {
    return this.ordersService.create(dto);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm payment and return receipt data' })
  @ApiResponse({ status: 200, description: 'Receipt data' })
  confirm(@Param('id') id: string, @Body() dto: ConfirmOrderDto): ReceiptData {
    return this.ordersService.confirm(id, dto);
  }
}
