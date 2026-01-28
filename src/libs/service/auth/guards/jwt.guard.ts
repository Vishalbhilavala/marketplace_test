import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AuthGuard } from '@nestjs/passport';
import { Model, Types } from 'mongoose';
import {
  BusinessClipStatus,
  BusinessPaymentStatus,
  PaymentStatus,
  Role,
} from 'src/libs/utils/constant/enum';
import {
  BusinessClips,
  BusinessClipsDocument,
} from 'src/schema/business-clip.schema';
import { User, UserDocument } from 'src/schema/user.schema';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(BusinessClips.name)
    private readonly businessClipModel: Model<BusinessClipsDocument>,
  ) {
    super();
  }

  handleRequest<TUser = UserDocument>(
    err: Error | null,
    user: UserDocument | null,
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }

    if (user.role === Role.BUSINESS) {
      this.validateBusinessSubscription(user.id as string).catch(() => null);
    }

    return user as TUser;
  }

  private async validateBusinessSubscription(
    businessId: string,
  ): Promise<void> {
    const now = new Date();

    const activeSubscription = await this.businessClipModel.findOne({
      business_id: new Types.ObjectId(businessId),
      status: BusinessClipStatus.ACTIVE,
      payment_status: BusinessPaymentStatus.RECEIVED,
    });

    if (!activeSubscription) return;

    if (
      activeSubscription.expiry_date &&
      activeSubscription.expiry_date < now
    ) {
      // 1️⃣ Expire subscription
      await this.businessClipModel.updateOne(
        { _id: activeSubscription._id },
        { $set: { status: BusinessClipStatus.EXPIRED } },
      );

      // 2️⃣ Reset business flags
      await this.userModel.updateOne(
        { _id: businessId },
        {
          $set: {
            plan_assigned: false,
            payment_status: PaymentStatus.PENDING,
          },
        },
      );
    }
  }
}
