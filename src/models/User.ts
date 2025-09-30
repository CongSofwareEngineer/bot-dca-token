import mongoose, { Schema, Document } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser {
  stepSize: string // Maximum amount to invest per trade in USD
  slippageTolerance: number // Acceptable slippage percentage
  maxPrice: string // Upper price limit for token purchase
  minPrice: string // Lower price limit for token purchase
  initialCapital: string // Initial capital allocated for DCA in USD
  isStop: boolean // Flag to indicate if DCA is paused
  priceBuyHistory: string
  tokenInput: string
  amountUSD: string
  ratioPriceUp: string
  amountETHBought: string
}

const UserSchema: Schema = new Schema(
  {
    stepSize: {
      type: String,
      required: [true, 'Step size is required'],
      default: '50',
      trim: true
    },
    slippageTolerance: {
      type: Number,
      required: [true, 'Slippage tolerance is required'],
      default: 1,
      min: 0,
      max: 100
    },
    maxPrice: {
      type: String,
      required: [true, 'Max price is required'],
      default: '3000',
      trim: true
    },
    minPrice: {
      type: String,
      required: [true, 'Min price is required'],
      default: '1000',
      trim: true
    },
    initialCapital: {
      type: String,
      required: [true, 'Initial capital is required'],
      default: '1000',
      trim: true
    },
    isStop: {
      type: Boolean,
      required: true,
      default: false
    },
    priceBuyHistory: {
      type: String,
      trim: true,
      default: ''
    },
    tokenInput: {
      type: String,
      trim: true,
      default: 'ETH'
    },
    amountUSD: {
      type: String,
      trim: true,
      default: '50'
    },
    ratioPriceUp: {
      type: String,
      trim: true,
      default: '5'
    },
    amountETHBought: {
      type: String,
      trim: true,
      default: '0'
    }
  },
  {
    timestamps: true
  }
)

// // Hash password before saving
// UserSchema.pre<IUser>('save', async function (next) {
//   if (!this.isModified('password')) return next()

//   try {
//     const salt = await bcrypt.genSalt(10)
//     this.password = await bcrypt.hash(this.password, salt)
//     next()
//   } catch (error: any) {
//     next(error)
//   }
// })

// // Compare password method
// UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
//   return bcrypt.compare(candidatePassword, this.password)
// }

export default mongoose.model<IUser>('User', UserSchema)
