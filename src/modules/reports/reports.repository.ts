import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report, ReportDocument } from './schemas/report.schema';

@Injectable()
export class ReportsRepository {
  constructor(
    @InjectModel(Report.name) private readonly model: Model<ReportDocument>,
  ) {}

  incrementTotal(customerId: string) {
    return this.model.updateOne(
      { customer_id: customerId },
      { $inc: { total_indications: 1 } },
      { upsert: true },
    );
  }

  findAll() {
    return this.model
      .find({}, { _id: 0, customer_id: 1, total_indications: 1 })
      .lean();
  }
}
