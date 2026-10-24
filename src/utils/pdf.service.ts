import { BadRequestException, Injectable } from '@nestjs/common';
import PDFDocument = require('pdfkit');
import { OrdersService } from '../orders/orders.service';
import { StoredOrder } from '../orders/types/order.types';

type PdfDocument = InstanceType<typeof PDFDocument>;

@Injectable()
export class PdfService {
  constructor(private readonly ordersService: OrdersService) {}

  renderInvoice(orderId: string): Promise<Buffer> {
    const order = this.ordersService.findById(orderId);
    return this.render(order, (doc) => this.drawInvoice(doc, order));
  }

  renderReceipt(orderId: string): Promise<Buffer> {
    const order = this.ordersService.findById(orderId);
    if (order.status !== 'paid' || !order.paidAt || !order.paymentReference) {
      throw new BadRequestException(`Order ${orderId} has not been paid`);
    }

    return this.render(order, (doc) => this.drawReceipt(doc, order));
  }

  private render(order: StoredOrder, draw: (doc: PdfDocument) => void): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    doc.fontSize(22).text('Noone', { align: 'center' });
    doc.moveDown(0.25);
    draw(doc);
    doc.end();
    return done;
  }

  private drawInvoice(doc: PdfDocument, order: StoredOrder): void {
    doc.fontSize(14).text('Invoice', { align: 'center' });
    doc.moveDown();
    this.drawOrderMeta(doc, order);
    doc.moveDown();

    doc.fontSize(12).text('Items');
    doc.moveDown(0.5);
    doc.fontSize(10);
    for (const item of order.items) {
      doc.text(
        `${item.packageName} x ${item.quantity} @ NGN ${item.unitPrice.toLocaleString('en-NG')} = NGN ${item.lineTotal.toLocaleString('en-NG')}`,
      );
    }

    doc.moveDown();
    doc.text(`Subtotal: NGN ${order.subtotal.toLocaleString('en-NG')}`);
    doc.text(`Delivery fee: NGN ${order.deliveryFee.toLocaleString('en-NG')}`);
    doc.text(`Due now: NGN ${order.totalDueNow.toLocaleString('en-NG')}`);
    doc.text(`Balance: NGN ${order.balanceRemaining.toLocaleString('en-NG')}`);
    doc.moveDown();
    doc.text(`Notes: ${order.notes}`);
  }

  private drawReceipt(doc: PdfDocument, order: StoredOrder): void {
    doc.fontSize(14).text('Receipt', { align: 'center' });
    doc.moveDown();
    this.drawOrderMeta(doc, order);
    doc.text(`Payment reference: ${order.paymentReference}`);
    doc.text(`Paid at: ${order.paidAt}`);
    doc.moveDown();
    doc.text(`Amount received: NGN ${order.totalDueNow.toLocaleString('en-NG')}`);
    doc.text(`Balance remaining: NGN ${order.balanceRemaining.toLocaleString('en-NG')}`);
    doc.moveDown();
    doc.text('Thank you for your payment.');
  }

  private drawOrderMeta(doc: PdfDocument, order: StoredOrder): void {
    doc.fontSize(10);
    doc.text(`Order: ${order.orderId}`);
    doc.text(`Customer: ${order.customerEmail}`);
    doc.text(`Status: ${order.status}`);
    doc.text(`Delivery date: ${order.deliveryDate}`);
  }
}
