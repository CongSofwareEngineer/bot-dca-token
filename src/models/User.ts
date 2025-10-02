import mongoose, { Schema } from 'mongoose'

export interface IUser {
  stepSize: string // Maximum amount to invest per trade in USD
  slippageTolerance: string // Acceptable slippage percentage
  maxPrice: string // Upper price limit for token purchase
  minPrice: string // Lower price limit for token purchase
  initialCapital: string // Initial capital allocated for DCA in USD
  capital: string // Current total USD amount invested
  isStop: boolean // Flag to indicate if DCA is paused
  priceBuyHistory: string
  tokenInput: string
  // Amount in USD to buy each interval
  ratioPriceUp: string
  ratioPriceDown: string
  // Current total USD amount invested
  amountUSDToBuy: string
  amountETHBought: string
  version: number
  ratioProfitToSell?: string
  ratioPriceByHistory?: string
}

const UserSchema: Schema = new Schema(
  {
    stepSize: {
      type: String,
      default: '50',
      trim: true
    },
    slippageTolerance: {
      type: String,
      default: '1'
    },
    maxPrice: {
      type: String,
      default: '3000',
      trim: true
    },
    minPrice: {
      type: String,
      default: '1000',
      trim: true
    },
    initialCapital: {
      type: String,
      default: '1000',
      trim: true
    },
    capital: {
      type: String,
      trim: true,
      default: '0'
    },
    isStop: {
      type: Boolean,
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
    ratioPriceUp: {
      type: String,
      trim: true,
      default: '5'
    },
    ratioPriceDown: {
      type: String,
      trim: true,
      default: '1'
    },
    amountETHBought: {
      type: String,
      trim: true,
      default: '0'
    },
    version: {
      type: Number,
      required: true,
      default: 1
    },
    amountUSDToBuy: {
      type: String,
      trim: true,
      default: '0'
    },
    ratioProfitToSell: {
      type: String,
      trim: true,
      default: '5'
    },
    ratioPriceByHistory: {
      type: String,
      trim: true,
      default: '1'
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false // Disable __v field
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
