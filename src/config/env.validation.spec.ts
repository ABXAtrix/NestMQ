import 'reflect-metadata';
import { validateEnvironment } from './env.validation';

describe('Environment Validation', () => {
  it('should validate valid environment configuration with defaults', () => {
    const config = {
      PORT: '3000',
      DATABASE_URI: 'mongodb://localhost:27017/nest-mq',
    };

    const result = validateEnvironment(config);

    expect(result.PORT).toBe(3000);
    expect(result.NODE_ENV).toBe('development');
    expect(result.DATABASE_URI).toBe('mongodb://localhost:27017/nest-mq');
  });

  it('should parse and validate custom port and environment', () => {
    const config = {
      PORT: '8080',
      NODE_ENV: 'production',
      REDIS_PORT: '6380',
    };

    const result = validateEnvironment(config);

    expect(result.PORT).toBe(8080);
    expect(result.NODE_ENV).toBe('production');
    expect(result.REDIS_PORT).toBe(6380);
  });

  it('should throw error when environment is invalid', () => {
    const config = {
      NODE_ENV: 'invalid-env',
    };

    expect(() => validateEnvironment(config)).toThrow(
      'Environment validation error',
    );
  });
});
