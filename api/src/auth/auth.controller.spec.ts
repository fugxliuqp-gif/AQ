import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe, UnauthorizedException } from '@nestjs/common';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let app: INestApplication;
  const mockAuthService = {
    login: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should reject empty username or password (DTO validation)', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: '', password: '' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({})
      .expect(400);
  });

  it('should return 200 with token on valid credentials', async () => {
    mockAuthService.login.mockResolvedValue({
      access_token: 'token123',
      user: { username: 'superadmin' },
    });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'superadmin', password: 'admin123' })
      .expect(200);

    expect(res.body.access_token).toBe('token123');
    expect(mockAuthService.login).toHaveBeenCalledWith('superadmin', 'admin123');
  });

  it('should propagate UnauthorizedException as 401', async () => {
    mockAuthService.login.mockRejectedValue(new UnauthorizedException('用户名或密码错误'));

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'bad', password: 'bad' })
      .expect(401);
  });
});
