import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export type JwtPayload = {
  userId: string;
  username: string;
  role: string;
  tenantId?: string;
  tenantCode?: string;
  tenantStatus?: string;
  modules: string[];
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    console.log('[JWT STRATEGY] secret length:', secret.length, 'secret prefix:', secret.substring(0, 10));
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    console.log('[JWT VALIDATE] payload:', JSON.stringify(payload));
    return payload;
  }
}
