import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReportDocument = HydratedDocument<Report>;

@Schema({
  collection: 'reports',
  versionKey: false,
  timestamps: { createdAt: false, updatedAt: 'updated_at' },
})
export class Report {
  @Prop({ type: Types.ObjectId, required: true, unique: true })
  customer_id: Types.ObjectId;

  @Prop({ default: 0 })
  total_indications: number;

  updated_at: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
