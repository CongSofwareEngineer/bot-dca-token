import mongoose, { Schema, Document } from 'mongoose'

export interface IDCATrade extends Document {
  planId: mongoose.Types.ObjectId;
  price: number; // execution price
  capitalUsed: number; // USD
  amount: number; // ETH acquired
  remainingCapitalAfter: number; // USD remaining after trade (total available - executedCapital)
  projectedAverage: number; // avg price post trade
  type: 'simulated' | 'executed';
  createdAt: Date;
}

const DCATradeSchema: Schema = new Schema(
  {
    planId: { type: Schema.Types.ObjectId, ref: 'DCAPlan', required: true },
    price: { type: Number, required: true },
    capitalUsed: { type: Number, required: true },
    amount: { type: Number, required: true },
    remainingCapitalAfter: { type: Number, required: true },
    projectedAverage: { type: Number, required: true },
    type: { type: String, enum: ['simulated', 'executed'], default: 'executed' }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

export default mongoose.model<IDCATrade>('DCATrade', DCATradeSchema)
