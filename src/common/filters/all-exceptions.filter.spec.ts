import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  const mockJson = jest.fn();
  const mockStatus = jest.fn().mockImplementation(() => ({ json: mockJson }));
  const mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
  const mockGetRequest = jest.fn().mockReturnValue({
    url: '/test-endpoint',
    method: 'POST',
  });

  const mockArgumentsHost = {
    switchToHttp: jest.fn().mockReturnValue({
      getResponse: mockGetResponse,
      getRequest: mockGetRequest,
    }),
  } as unknown as ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should catch HttpException and format structured error response', () => {
    const exception = new HttpException(
      'Forbidden resource',
      HttpStatus.FORBIDDEN,
    );

    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.FORBIDDEN,
        path: '/test-endpoint',
        method: 'POST',
        message: 'Forbidden resource',
      }),
    );
  });

  it('should format validation errors with details array', () => {
    const validationResponse = {
      statusCode: 400,
      error: 'Bad Request',
      message: ['email must be an email', 'name should not be empty'],
    };
    const exception = new HttpException(
      validationResponse,
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        details: validationResponse.message,
      }),
    );
  });

  it('should catch generic Error and format 500 internal server error', () => {
    const exception = new Error('Unexpected database failure');

    filter.catch(exception, mockArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Unexpected database failure',
        error: 'Error',
      }),
    );
  });
});
