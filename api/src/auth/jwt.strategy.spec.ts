import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('should validate and return payload as-is', async () => {
    const strategy = new JwtStrategy();
    const payload = {
      userId: '1',
      username: 'superadmin',
      role: 'super_admin',
      modules: ['ehs'],
    };
    const result = await strategy.validate(payload);
    expect(result).toEqual(payload);
  });
});
