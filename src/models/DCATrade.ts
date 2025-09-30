import mongoose, { Schema } from 'mongoose'

export interface IDCATrade {
  idToken: string; // Token ID (e.g., '1027' for ETH)
  isSwap?: boolean; // true if executed via swap
  infoSwap?: {
    from: string; // from token address
    to: string; // to token address
    amountIn?: number; // amount of from token
    amountOut?: number; // amount of to token received
    txHash?: string; // transaction hash

    [key: string]: unknown
  }
  buyAmountUSD?: string; // Amount in USD used to buy (if not swap)
  sellAmountUSD?: string; // Amount in USD received from selling (if not swap)
  createdAt: Date;
}

const DCATradeSchema: Schema = new Schema(
  {
    idToken: { type: Schema.Types.ObjectId, ref: 'Token', required: true },
    isSwap: { type: Boolean, required: true },
    infoSwap: {
      from: { type: String, required: false },
      to: { type: String, required: false },
      amountIn: { type: Number, required: false },
      amountOut: { type: Number, required: false },
      txHash: { type: String, required: false }
    },
    buyAmountUSD: { type: String, required: false },
    sellAmountUSD: { type: String, required: false }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

export default mongoose.model<IDCATrade>('DCATrade', DCATradeSchema)
