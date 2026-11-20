import { Test, TestingModule } from '@nestjs/testing';
import { CustomerController } from './customers.controller';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

describe('CustomersController', () => {
  let controller: CustomerController;
  let service: CustomerService;

  const mockCustomerService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerController],
      providers: [
        {
          provide: CustomerService,
          useValue: mockCustomerService,
        },
      ],
    }).compile();

    controller = module.get<CustomerController>(CustomerController);
    service = module.get<CustomerService>(CustomerService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call customerService.create with dto and return result', async () => {
      const dto: CreateCustomerDto = {
        name: 'Maria Silva',
        email: 'maria@example.com',
      };
      const expectedResult = {
        _id: '64b8f0c2e1f2a3b4c5d6e7f8',
        name: 'Maria Silva',
        email: 'maria@example.com',
        type: 'NORMAL',
        parent_customer_id: null,
      };

      mockCustomerService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });
});
