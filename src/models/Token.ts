import mongoose, { Schema, Document } from 'mongoose'

export interface IToken extends Document {
  userId: mongoose.Types.ObjectId;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  price: number;
  amount: number;
  totalValue: number;
  dcaAmount: number; // Dollar Cost Average amount
  dcaFrequency: 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TokenSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    tokenAddress: {
      type: String,
      required: [true, 'Token address is required'],
      trim: true
    },
    tokenName: {
      type: String,
      required: [true, 'Token name is required'],
      trim: true
    },
    tokenSymbol: {
      type: String,
      required: [true, 'Token symbol is required'],
      trim: true,
      uppercase: true
    },
    price: {
      type: Number,
      required: [true, 'Token price is required'],
      min: [0, 'Price must be positive']
    },
    amount: {
      type: Number,
      required: [true, 'Token amount is required'],
      min: [0, 'Amount must be positive']
    },
    totalValue: {
      type: Number,
      required: [true, 'Total value is required'],
      min: [0, 'Total value must be positive']
    },
    dcaAmount: {
      type: Number,
      required: [true, 'DCA amount is required'],
      min: [0, 'DCA amount must be positive']
    },
    dcaFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: [true, 'DCA frequency is required']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
)

// Create compound index for efficient queries
TokenSchema.index({ userId: 1, tokenAddress: 1 })
TokenSchema.index({ userId: 1, isActive: 1 })

export default mongoose.model<IToken>('Token', TokenSchema)
