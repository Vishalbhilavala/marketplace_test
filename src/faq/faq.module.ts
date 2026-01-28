import { Module } from '@nestjs/common';
import { FaqService } from './faq.service';
import { FaqController } from './faq.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Faq, faqSchema } from 'src/schema/faq.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Faq.name, schema: faqSchema }])],
  providers: [FaqService],
  controllers: [FaqController],
})
export class FaqModule {}
