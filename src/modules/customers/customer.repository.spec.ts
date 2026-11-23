import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { CustomerRepository } from './customer.repository';
import { Customer } from './schemas/customer.schema';
import { CreateCustomerDto } from './dto/create-customer.dto';

describe('CustomerRepository', () => {
  let repository: CustomerRepository;

  const mockExec = jest.fn();
  const mockLean = jest.fn().mockReturnValue({ exec: mockExec });
  const mockFindById = jest.fn().mockReturnValue({ lean: mockLean });
  const mockCreate = jest.fn();

  const mockCustomerModel = {
    create: mockCreate,
    findById: mockFindById,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerRepository,
        {
          provide: getModelToken(Customer.name),
          useValue: mockCustomerModel,
        },
      ],
    }).compile();

    repository = module.get<CustomerRepository>(CustomerRepository);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should call model.create with dto', async () => {
      const dto: CreateCustomerDto = {
        name: 'Julia Souza',
        email: 'julia@example.com',
      };
      const createdDoc = { ...dto, _id: '64b8f0c2e1f2a3b4c5d6e7f8' };
      mockCreate.mockResolvedValue(createdDoc);

      const result = await repository.create(dto);

      expect(mockCreate).toHaveBeenCalledWith(dto);
      expect(result).toEqual(createdDoc);
    });
  });

  describe('findById', () => {
    it('should call model.findById with id and return lean doc', async () => {
      const id = '64b8f0c2e1f2a3b4c5d6e7f8';
      const foundDoc = { _id: id, name: 'Julia Souza' };
      mockExec.mockResolvedValue(foundDoc);

      const result = await repository.findById(id);

      expect(mockFindById).toHaveBeenCalledWith(id);
      expect(result).toEqual(foundDoc);
    });
  });
});
