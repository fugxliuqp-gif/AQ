import { of, lastValueFrom } from 'rxjs';
import { BigIntInterceptor } from './bigint.interceptor';

describe('BigIntInterceptor', () => {
  const interceptor = new BigIntInterceptor();

  function mockHandler(data: any) {
    return { handle: () => of(data) } as any;
  }

  it('should convert top-level bigint to string', async () => {
    const result = await lastValueFrom(
      interceptor.intercept({} as any, mockHandler({ id: 1n, name: 'test' })),
    );
    expect(result.id).toBe('1');
    expect(result.name).toBe('test');
  });

  it('should convert nested bigints recursively', async () => {
    const result = await lastValueFrom(
      interceptor.intercept(
        {} as any,
        mockHandler({
          tenant: { id: 99n, users: [{ id: 11n }, { id: 12n }] },
        }),
      ),
    );
    expect(result.tenant.id).toBe('99');
    expect(result.tenant.users[0].id).toBe('11');
    expect(result.tenant.users[1].id).toBe('12');
  });

  it('should handle arrays of bigints', async () => {
    const result = await lastValueFrom(
      interceptor.intercept({} as any, mockHandler([1n, 2n, 3n])),
    );
    expect(result).toEqual(['1', '2', '3']);
  });

  it('should leave null and undefined unchanged', async () => {
    const result = await lastValueFrom(
      interceptor.intercept(
        {} as any,
        mockHandler({ a: null, b: undefined, c: 1n }),
      ),
    );
    expect(result.a).toBeNull();
    expect(result.b).toBeUndefined();
    expect(result.c).toBe('1');
  });

  it('should convert Date to ISO string', async () => {
    const date = new Date('2026-01-15T08:00:00.000Z');
    const result = await lastValueFrom(
      interceptor.intercept({} as any, mockHandler({ createdAt: date, id: 1n })),
    );
    expect(result.createdAt).toBe('2026-01-15T08:00:00.000Z');
    expect(result.id).toBe('1');
  });

  it('should handle plain non-object values', async () => {
    expect(await lastValueFrom(interceptor.intercept({} as any, mockHandler('hello')))).toBe(
      'hello',
    );
    expect(await lastValueFrom(interceptor.intercept({} as any, mockHandler(42)))).toBe(42);
  });
});
