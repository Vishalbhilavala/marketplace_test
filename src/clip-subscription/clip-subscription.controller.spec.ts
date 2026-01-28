import { Test, TestingModule } from '@nestjs/testing';
import { ClipSubscriptionController } from './clip-subscription.controller';
import { ClipSubscriptionService } from './clip-subscription.service';

describe('ClipSubscriptionController', () => {
  let controller: ClipSubscriptionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClipSubscriptionController],
      providers: [ClipSubscriptionService],
    }).compile();

    controller = module.get<ClipSubscriptionController>(
      ClipSubscriptionController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
