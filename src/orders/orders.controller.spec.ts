import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PdfService } from '../utils/pdf.service';

const parsePdf = (res: any, callback: (err: Error | null, body: Buffer) => void) => {
  const chunks: Buffer[] = [];
  res.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
  res.on('end', () => callback(null, Buffer.concat(chunks)));
};

describe('OrdersController (orders by email)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [OrdersService, PdfService],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists orders for the given email', async () => {
    const created = await request(app.getHttpServer())
      .post('/orders')
      .send({
        customerEmail: 'HR@Acme.com',
        items: [{ packageName: 'Box A', quantity: 1, unitPrice: 10000 }],
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/orders')
      .query({ email: 'hr@acme.com' })
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0].orderId).toBe(created.body.orderId);
  });

  it('returns an invoice PDF', async () => {
    const created = await request(app.getHttpServer())
      .post('/orders')
      .send({
        customerEmail: 'pdf@acme.com',
        items: [{ packageName: 'Box A', quantity: 2, unitPrice: 10000 }],
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get(`/orders/${created.body.orderId}/invoice.pdf`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      })
      .expect(200);

    expect(response.headers['content-type']).toContain('application/pdf');
    expect(Buffer.from(response.body).subarray(0, 4).toString()).toBe('%PDF');
  });

  it('returns a receipt PDF for a paid order', async () => {
    const created = await request(app.getHttpServer())
      .post('/orders')
      .send({
        customerEmail: 'receipt@acme.com',
        items: [{ packageName: 'Box A', quantity: 1, unitPrice: 10000 }],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/orders/${created.body.orderId}/confirm`)
      .send({ paymentReference: 'PSK_receipt_ref' })
      .expect(200);

    const response = await request(app.getHttpServer())
      .get(`/orders/${created.body.orderId}/receipt.pdf`)
      .buffer(true)
      .parse(parsePdf)
      .expect(200);

    expect(response.headers['content-type']).toContain('application/pdf');
    expect(Buffer.from(response.body).subarray(0, 4).toString()).toBe('%PDF');
  });

  it('rejects a receipt PDF for an unpaid order', async () => {
    const created = await request(app.getHttpServer())
      .post('/orders')
      .send({
        customerEmail: 'unpaid@acme.com',
        items: [{ packageName: 'Box A', quantity: 1, unitPrice: 10000 }],
      })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/orders/${created.body.orderId}/receipt.pdf`)
      .expect(400);
  });
});
