import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrdersController } from './orders/orders.controller';
import { OrdersService } from './orders/orders.service';
import { PdfService } from './utils/pdf.service';

@Module({
  imports: [],
  controllers: [AppController, OrdersController],
  providers: [AppService, OrdersService, PdfService],
})
export class AppModule {}
