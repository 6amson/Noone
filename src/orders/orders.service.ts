import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { InvoiceData, ReceiptData, StoredOrder } from './types/order.types';

const DEPOSIT_THRESHOLD = 150_000;
const DEPOSIT_PERCENT = 0.5;
const DELIVERY_FEE = 5_000;
const CUTOFF_HOUR = 15; // 3pm

@Injectable()
export class OrdersService {
  private orders = new Map<string, StoredOrder>();
  private nextId = 1001;

  create(dto: CreateOrderDto): InvoiceData {
    if (!dto.items?.length) {
      throw new BadRequestException('At least one item is required');
    }
    if (!dto.customerEmail) {
      throw new BadRequestException('customerEmail is required');
    }

    const items = dto.items.map((item) => ({
      packageName: item.packageName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.quantity * item.unitPrice,
    }));

    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const depositRequired = subtotal >= DEPOSIT_THRESHOLD ? Math.round(subtotal * DEPOSIT_PERCENT) : subtotal;
    const totalDueNow = depositRequired + DELIVERY_FEE;
    const balanceRemaining = subtotal - depositRequired;

    const deliveryDate = this.resolveDeliveryDate(dto.requestedDeliveryDate);
    const orderId = `NOO-${this.nextId++}`;

    const notesParts: string[] = [];
    if (subtotal >= DEPOSIT_THRESHOLD) {
      notesParts.push('50% deposit required; balance due before dispatch');
    }
    if (dto.requestedDeliveryDate && dto.requestedDeliveryDate !== deliveryDate) {
      notesParts.push(`Requested date adjusted to ${deliveryDate} (after 3pm cutoff — later delivery only)`);
    }

    const stored: StoredOrder = {
      orderId,
      status: 'pending',
      items,
      subtotal,
      deliveryFee: DELIVERY_FEE,
      depositRequired,
      totalDueNow,
      balanceRemaining,
      deliveryDate,
      notes: notesParts.join('. ') || 'Full payment',
      customerEmail: this.normalizeEmail(dto.customerEmail),
      occasion: dto.occasion,
      recipientCount: dto.recipientCount,
      deliveryArea: dto.deliveryArea,
      customerNote: dto.customerNote,
      createdAt: new Date().toISOString(),
    };

    this.orders.set(orderId, stored);

    return this.toInvoiceData(stored);
  }

  findByEmail(email: string): InvoiceData[] {
    const normalized = this.normalizeEmail(email);

    return Array.from(this.orders.values())
      .filter((order) => order.customerEmail === normalized)
      .reverse()
      .map((order) => this.toInvoiceData(order));
  }

  confirm(orderId: string, dto: ConfirmOrderDto): ReceiptData {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    if (order.status === 'paid') {
      throw new BadRequestException(`Order ${orderId} is already paid`);
    }

    const paidAt = new Date().toISOString();
    const paymentReference = dto.paymentReference;

    order.status = 'paid';
    order.paidAt = paidAt;
    order.paymentReference = paymentReference;
    this.orders.set(orderId, order);

    return {
      orderId: order.orderId,
      status: 'paid',
      amountReceived: order.totalDueNow,
      paymentReference,
      paidAt,
      balanceRemaining: order.balanceRemaining,
    };
  }

  private toInvoiceData(order: StoredOrder): InvoiceData {
    return {
      orderId: order.orderId,
      status: order.status,
      items: order.items,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      depositRequired: order.depositRequired,
      totalDueNow: order.totalDueNow,
      balanceRemaining: order.balanceRemaining,
      deliveryDate: order.deliveryDate,
      notes: order.notes,
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private resolveDeliveryDate(requested?: string): string {
    const now = new Date();
    const isAfterCutoff = now.getHours() >= CUTOFF_HOUR;

    if (!requested) {
      const d = new Date(now);
      d.setDate(d.getDate() + (isAfterCutoff ? 2 : 1));
      return d.toISOString().slice(0, 10);
    }

    const req = new Date(requested);
    if (Number.isNaN(req.getTime())) {
      throw new BadRequestException('Invalid requestedDeliveryDate');
    }

    const today = new Date(now.toISOString().slice(0, 10));
    const reqDay = new Date(requested);

    if (reqDay <= today && isAfterCutoff) {
      const later = new Date(today);
      later.setDate(later.getDate() + 2);
      return later.toISOString().slice(0, 10);
    }

    return requested;
  }
}
