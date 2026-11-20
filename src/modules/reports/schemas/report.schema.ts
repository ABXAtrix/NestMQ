import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReportDocument = HydratedDocument<Report>;

@Schema({
  collection: 'reports',
  versionKey: false,
  timestamps: { createdAt: false, updatedAt: true },
})
export class Report {
  @Prop({ type: Types.ObjectId, required: true, unique: true })
  customerId: Types.ObjectId;
  @Prop({ default: 0 }) totalIndications: number;
  updatedAt: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
