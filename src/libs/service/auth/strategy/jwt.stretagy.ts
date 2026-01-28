import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
dotenv.config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.jwtSecretKey ?? 'jwtsecret',
    });
  }

  validate(payload: unknown): Record<string, unknown> {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid JWT payload');
    }

    return payload as Record<string, unknown>;
  }
}
