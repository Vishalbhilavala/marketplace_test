import { Test, TestingModule } from '@nestjs/testing';
import { CountyService } from './county.service';

describe('CountyService', () => {
  let service: CountyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CountyService],
    }).compile();

    service = module.get<CountyService>(CountyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
