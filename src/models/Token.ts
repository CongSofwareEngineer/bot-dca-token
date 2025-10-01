import mongoose, { Schema, ObjectId } from 'mongoose'

export interface IToken {
  _id?: ObjectId
  tokenAddress: string;
  tokenSymbol: string;
  idBinance?: string;
  decimals?: number;
}

const TokenSchema: Schema = new Schema(
  {
    tokenAddress: {
      type: String,
      required: [true, 'Token address is required'],
      trim: true
    },

    tokenSymbol: {
      type: String,
      required: [true, 'Token symbol is required'],
      trim: true,
      uppercase: true
    },
    idBinance: { type: String, trim: true },
    decimals: { type: Number, default: 18, required: false }

  },
  {
    timestamps: {
      createdAt: true, updatedAt: false
    },
    versionKey: false // Disable __v field
  }
)

// Create compound index for efficient queries
TokenSchema.index({ userId: 1, tokenAddress: 1 })
TokenSchema.index({ userId: 1, isActive: 1 })

export default mongoose.model<IToken>('Token', TokenSchema)
