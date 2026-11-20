import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export const INDICATION_EXCHANGE = 'indication.exchange';
export const INDICATION_ROUTING_KEY = 'customer.indicated';
export const INDICATION_EXCHAGE = INDICATION_EXCHANGE;

export interface IndicationEvent {
  customer_id: string;
  parent_customer_id: string;
}

@Schema({
  collection: 'customers',
  versionKey: false,
  timestamps: { createdAt: 'created_at', updatedAt: false },
})
export class Customer {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ default: 'NORMAL', enum: ['NORMAL'] })
  type!: string;

  @Prop({ type: Types.ObjectId, default: null })
  parent_customer_id!: Types.ObjectId | null;

  created_at!: Date;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
export type CustomerDocument = HydratedDocument<Customer>;
