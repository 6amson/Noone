import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

describe('OrdersController (orders by email)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [OrdersService],
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
});
