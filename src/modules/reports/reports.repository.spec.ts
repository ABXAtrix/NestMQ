import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { ReportsRepository } from './reports.repository';
import { Report } from './schemas/report.schema';

describe('ReportsRepository', () => {
  let repository: ReportsRepository;

  const mockLean = jest.fn();
  const mockFind = jest.fn().mockReturnValue({ lean: mockLean });
  const mockUpdateOne = jest.fn();

  const mockReportModel = {
    updateOne: mockUpdateOne,
    find: mockFind,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsRepository,
        {
          provide: getModelToken(Report.name),
          useValue: mockReportModel,
        },
      ],
    }).compile();

    repository = module.get<ReportsRepository>(ReportsRepository);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('incrementTotal', () => {
    it('should call model.updateOne with customerId, $inc and upsert', async () => {
      const customerId = '64b8f0c2e1f2a3b4c5d6e700';
      const updateResult = { acknowledged: true, modifiedCount: 1 };
      mockUpdateOne.mockResolvedValue(updateResult);

      const result = await repository.incrementTotal(customerId);

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { customerId },
        { $inc: { totalIndications: 1 } },
        { upsert: true },
      );
      expect(result).toEqual(updateResult);
    });
  });

  describe('findAll', () => {
    it('should call model.find and return lean projection', async () => {
      const mockReports = [
        { customerId: '64b8f0c2e1f2a3b4c5d6e700', totalIndications: 4 },
      ];
      mockLean.mockResolvedValue(mockReports);

      const result = await repository.findAll();

      expect(mockFind).toHaveBeenCalledWith(
        {},
        { _id: 0, customerId: 1, totalIndications: 1 },
      );
      expect(result).toEqual(mockReports);
    });
  });
});
