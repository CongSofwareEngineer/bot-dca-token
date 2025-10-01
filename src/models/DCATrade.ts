import mongoose, { Schema } from 'mongoose'

export interface IDCATrade {
  _id?: string;
  idUser?: string; // User ID
  idToken: string; // Token ID (e.g., '1027' for ETH)
  isBuy?: boolean; // true if executed via swap
  isSell?: boolean; // true if executed via swap
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
  price: string
}

const DCATradeSchema: Schema = new Schema(
  {
    idUser: { type: String, required: true },
    idToken: { type: String, required: true },
    isBuy: { type: Boolean, required: false },
    isSell: { type: Boolean, required: false },
    price: { type: String, required: true },
    infoSwap: { type: Object, required: false },
    buyAmountUSD: { type: String, required: false },
    sellAmountUSD: { type: String, required: false }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false // Disable __v field
  }
)

export default mongoose.model<IDCATrade>('DCATrade', DCATradeSchema)
