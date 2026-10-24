import { OrdersService } from './orders.service';
import { InvoiceData } from './types/order.types';

type OrdersServiceWithLookup = OrdersService & {
  findByEmail(email: string): InvoiceData[];
};

describe('OrdersService email lookup', () => {
  let service: OrdersServiceWithLookup;

  beforeEach(() => {
    service = new OrdersService() as OrdersServiceWithLookup;
  });

  const buildOrder = (customerEmail: string, packageName: string) => ({
    customerEmail,
    items: [{ packageName, quantity: 1, unitPrice: 10000 }],
  });

  it('lists only orders for the normalized email, newest first', () => {
    service.create(buildOrder('HR@Acme.com ', 'Box A'));
    service.create(buildOrder('other@acme.com', 'Box B'));
    service.create(buildOrder('hr@acme.com', 'Box C'));

    const orders = service.findByEmail(' hr@ACME.com');

    expect(orders).toHaveLength(2);
    expect(orders.map((order) => order.items[0].packageName)).toEqual(['Box C', 'Box A']);
  });

  it('returns an empty list when the email has no orders', () => {
    service.create(buildOrder('hr@acme.com', 'Box A'));

    expect(service.findByEmail('nobody@acme.com')).toEqual([]);
  });
});
