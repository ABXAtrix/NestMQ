import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  const mockSetHeader = jest.fn();
  const mockResponse = {
    statusCode: 200,
    setHeader: mockSetHeader,
  };

  const mockRequest = {
    method: 'GET',
    url: '/customers',
    ip: '127.0.0.1',
    headers: {},
    get: jest.fn().mockReturnValue('jest-agent'),
  };

  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn().mockReturnValue(mockResponse),
    }),
  } as unknown as ExecutionContext;

  const mockCallHandler: CallHandler = {
    handle: jest.fn().mockReturnValue(of({ success: true })),
  };

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should attach X-Request-Id header and pass through next.handle()', (done) => {
    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (val) => {
        expect(val).toEqual({ success: true });
        expect(mockSetHeader).toHaveBeenCalledWith(
          'X-Request-Id',
          expect.any(String),
        );
        done();
      },
      error: done,
    });
  });

  it('should preserve incoming x-request-id if provided', (done) => {
    const customReq = {
      ...mockRequest,
      headers: { 'x-request-id': 'custom-req-id-123' },
    };
    const ctx = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(customReq),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as unknown as ExecutionContext;

    interceptor.intercept(ctx, mockCallHandler).subscribe({
      next: () => {
        expect(mockSetHeader).toHaveBeenCalledWith(
          'X-Request-Id',
          'custom-req-id-123',
        );
        done();
      },
      error: done,
    });
  });
});
