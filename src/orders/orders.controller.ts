import { Body, Controller, Get, HttpCode, Param, Post, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { OrdersService } from './orders.service';
import { PdfService } from '../utils/pdf.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { InvoiceDataDto } from './dto/invoice-data.dto';
import { ReceiptDataDto } from './dto/receipt-data.dto';
import { InvoiceData, ReceiptData } from './types/order.types';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly pdfService: PdfService,
  ) {}

  @Get()
  @ApiOperation({ operationId: 'listOrders', summary: 'List orders for a customer email' })
  @ApiOkResponse({ type: [InvoiceDataDto], description: 'Orders for the email, newest first' })
  list(@Query() query: ListOrdersQueryDto): InvoiceData[] {
    return this.ordersService.findByEmail(query.email);
  }

  @Get(':id/invoice.pdf')
  @ApiOperation({ operationId: 'getInvoicePdf', summary: 'Download an invoice PDF' })
  @ApiProduces('application/pdf')
  @ApiOkResponse({
    description: 'Invoice PDF',
    content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
  })
  async invoicePdf(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const pdf = await this.pdfService.renderInvoice(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="invoice-${id}.pdf"`,
      'Content-Length': pdf.length.toString(),
      'Cache-Control': 'no-store',
    });

    return new StreamableFile(pdf);
  }

  @Get(':id/receipt.pdf')
  @ApiOperation({ operationId: 'getReceiptPdf', summary: 'Download a receipt PDF' })
  @ApiProduces('application/pdf')
  @ApiOkResponse({
    description: 'Receipt PDF',
    content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
  })
  @ApiBadRequestResponse({ description: 'Order has not been paid' })
  async receiptPdf(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const pdf = await this.pdfService.renderReceipt(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="receipt-${id}.pdf"`,
      'Content-Length': pdf.length.toString(),
      'Cache-Control': 'no-store',
    });

    return new StreamableFile(pdf);
  }

  @Post()
  @ApiOperation({ operationId: 'createOrder', summary: 'Create a pending order and return invoice data' })
  @ApiCreatedResponse({ type: InvoiceDataDto, description: 'Invoice data with amounts due' })
  create(@Body() dto: CreateOrderDto): InvoiceData {
    return this.ordersService.create(dto);
  }

  @Post(':id/confirm')
  @HttpCode(200)
  @ApiOperation({ operationId: 'confirmPayment', summary: 'Confirm payment and return receipt data' })
  @ApiOkResponse({ type: ReceiptDataDto, description: 'Receipt data' })
  confirm(@Param('id') id: string, @Body() dto: ConfirmOrderDto): ReceiptData {
    return this.ordersService.confirm(id, dto);
  }
}
