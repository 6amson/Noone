import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { InvoiceDataDto } from './dto/invoice-data.dto';
import { ReceiptDataDto } from './dto/receipt-data.dto';
import { InvoiceData, ReceiptData } from './types/order.types';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ operationId: 'createOrder', summary: 'Create a pending order and return invoice data' })
  @ApiCreatedResponse({ type: InvoiceDataDto, description: 'Invoice data with amounts due' })
  create(@Body() dto: CreateOrderDto): InvoiceData {
    return this.ordersService.create(dto);
  }

  @Post(':id/confirm')
  @ApiOperation({ operationId: 'confirmPayment', summary: 'Confirm payment and return receipt data' })
  @ApiOkResponse({ type: ReceiptDataDto, description: 'Receipt data' })
  confirm(@Param('id') id: string, @Body() dto: ConfirmOrderDto): ReceiptData {
    return this.ordersService.confirm(id, dto);
  }
}
