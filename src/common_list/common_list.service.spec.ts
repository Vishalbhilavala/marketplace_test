import { Test, TestingModule } from '@nestjs/testing';
import { CommonListService } from './common_list.service';

describe('CommonListService', () => {
  let service: CommonListService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommonListService],
    }).compile();

    service = module.get<CommonListService>(CommonListService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
