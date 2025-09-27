export interface User {
  _id?: string;
  username: string;
  email: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Token {
  _id?: string;
  userId: string;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  price: number;
  amount: number;
  totalValue: number;
  dcaAmount: number; // Dollar Cost Average amount
  dcaFrequency: 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
}

export interface DCARequest {
  tokenAddress: string;
  amount: string; // Amount in USD
  targetTokenAddress: string;
  slippage?: number; // Default 1%
}

export interface DCAResponse {
  transactionHash: string;
  amountIn: string;
  amountOut: string;
  tokenPrice: string;
  gasUsed: string;
  timestamp: number;
}

export interface TokenPrice {
  address: string;
  symbol: string;
  price: number;
  priceUSD: string;
  timestamp: number;
}

export interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOutMin: string;
  recipient: string;
  deadline: number;
}
