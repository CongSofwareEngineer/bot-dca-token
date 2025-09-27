import mongoose, { Schema, Document } from 'mongoose'

export interface IDCAPlan extends Document {
  tokenSymbol: string; // 'ETH'
  minPrice: number; // 1000
  maxPrice: number; // 2000
  targetAveragePrice: number; // 1500
  initialCapital: number; // 1000
  monthlyTopUp: number; // 200
  startDate: Date;
  executedCapital: number; // USD spent so far
  executedAmount: number; // ETH acquired so far
  lastCapitalSnapshot: number; // last computed total available capital (initial + topups)
  status: 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const DCAPlanSchema: Schema = new Schema(
  {
    tokenSymbol: { type: String, required: true, default: 'ETH' },
    minPrice: { type: Number, required: true },
    maxPrice: { type: Number, required: true },
    targetAveragePrice: { type: Number, required: true },
    initialCapital: { type: Number, required: true },
    monthlyTopUp: { type: Number, required: true },
    startDate: { type: Date, required: true },
    executedCapital: { type: Number, required: true, default: 0 },
    executedAmount: { type: Number, required: true, default: 0 },
    lastCapitalSnapshot: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['active', 'completed'], default: 'active' }
  },
  { timestamps: true }
)

export default mongoose.model<IDCAPlan>('DCAPlan', DCAPlanSchema)
