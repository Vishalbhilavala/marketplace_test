import { Test, TestingModule } from '@nestjs/testing';
import { CommonListController } from './common_list.controller';

describe('CommonListController', () => {
  let controller: CommonListController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommonListController],
    }).compile();

    controller = module.get<CommonListController>(CommonListController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
