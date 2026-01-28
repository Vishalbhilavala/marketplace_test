import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { TimeFrameType } from 'src/libs/utils/constant/enum';

export class AdminDto {
  @ApiProperty({
    example: TimeFrameType.MONTH,
    type: 'string',
    format: 'string',
    enum: [TimeFrameType],
    required: false,
  })
  @IsNotEmpty()
  @IsString()
  timeFrame: TimeFrameType;
}
