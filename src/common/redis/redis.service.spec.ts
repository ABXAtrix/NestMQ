import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;

  const mockRedisClient = {
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    exists: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    quit: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('redis://localhost:6379'),
  } as unknown as ConfigService;

  beforeEach(() => {
    service = new RedisService(mockConfigService);
    // Inject mock client
    (service as unknown as { client: typeof mockRedisClient }).client =
      mockRedisClient;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exists', () => {
    it('should return true if client.exists returns 1', async () => {
      mockRedisClient.exists.mockResolvedValue(1);

      const result = await service.exists('test-key');

      expect(mockRedisClient.exists).toHaveBeenCalledWith('test-key');
      expect(result).toBe(true);
    });

    it('should return false if client.exists returns 0', async () => {
      mockRedisClient.exists.mockResolvedValue(0);

      const result = await service.exists('test-key');

      expect(result).toBe(false);
    });
  });

  describe('get', () => {
    it('should call client.get and return value', async () => {
      mockRedisClient.get.mockResolvedValue('stored-value');

      const result = await service.get('test-key');

      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
      expect(result).toBe('stored-value');
    });
  });

  describe('set', () => {
    it('should call client.set with EX when ttlSeconds is provided', async () => {
      mockRedisClient.set.mockResolvedValue('OK');

      await service.set('test-key', 'value', 3600);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test-key',
        'value',
        'EX',
        3600,
      );
    });

    it('should call client.set without EX when ttlSeconds is omitted', async () => {
      mockRedisClient.set.mockResolvedValue('OK');

      await service.set('test-key', 'value');

      expect(mockRedisClient.set).toHaveBeenCalledWith('test-key', 'value');
    });
  });

  describe('del', () => {
    it('should call client.del', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      await service.del('test-key');

      expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
    });
  });

  describe('onModuleDestroy', () => {
    it('should call quit on client', async () => {
      await service.onModuleDestroy();

      expect(mockRedisClient.quit).toHaveBeenCalled();
    });
  });
});
