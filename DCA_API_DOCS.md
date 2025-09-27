# DCA (Dollar Cost Averaging) API Documentation

## 🚀 Overview

API cho phép thực hiện Dollar Cost Averaging tự động với các token ERC-20. API này **không yêu cầu authentication** để thuận tiện cho việc gọi từ cronjob server.

## 📋 Requirements

- viem: Ethereum interaction
- bignumber.js: Precise number calculations
- Environment variables configured

## ⚙️ Configuration

### Environment Variables (.env)
```bash
# Blockchain Configuration
RPC_URL=https://rpc.ankr.com/eth
DCA_PRIVATE_KEY=your-private-key-here-for-dca-wallet
DCA_WALLET_ADDRESS=your-wallet-address-here

# Token Addresses
USDT_ADDRESS=0xdAC17F958D2ee523a2206206994597C13D831ec7
USDC_ADDRESS=0xA0b86a33E6441Cc3C07A33b1Eb9Ad6E99f0D8D8E
```

## 🔗 API Endpoints

### 1. Execute DCA
**POST** `/api/dca/execute`

Thực hiện giao dịch DCA thực tế.

```json
{
  "tokenAddress": "0xA0b86a33E6441Cc3C07A33b1Eb9Ad6E99f0D8D8E", // USDC
  "amount": "100", // $100 USD
  "targetTokenAddress": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", // UNI token
  "slippage": 1 // 1% slippage (optional, default 1%)
}
```

**Response:**
```json
{
  "success": true,
  "message": "DCA executed successfully",
  "data": {
    "transactionHash": "0x123...",
    "amountIn": "100",
    "amountOut": "95.234",
    "tokenPrice": "1.05",
    "gasUsed": "21000",
    "timestamp": 1695808800000
  }
}
```

### 2. Simulate DCA
**POST** `/api/dca/simulate`

Mô phỏng giao dịch DCA để kiểm tra giá và amount.

```json
{
  "tokenAddress": "0xA0b86a33E6441Cc3C07A33b1Eb9Ad6E99f0D8D8E",
  "amount": "100",
  "targetTokenAddress": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  "slippage": 1
}
```

### 3. Batch DCA
**POST** `/api/dca/batch`

Thực hiện nhiều giao dịch DCA cùng lúc.

```json
{
  "transactions": [
    {
      "tokenAddress": "0xA0b86a33E6441Cc3C07A33b1Eb9Ad6E99f0D8D8E",
      "amount": "50",
      "targetTokenAddress": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"
    },
    {
      "tokenAddress": "0xA0b86a33E6441Cc3C07A33b1Eb9Ad6E99f0D8D8E",
      "amount": "30",
      "targetTokenAddress": "0x514910771AF9Ca656af840dff83E8264EcF986CA"
    }
  ]
}
```

### 4. Get Token Balance
**GET** `/api/dca/token/:tokenAddress/balance`

Query parameters:
- `walletAddress` (optional): Specific wallet address

```bash
GET /api/dca/token/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/balance
GET /api/dca/token/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/balance?walletAddress=0x123...
```

**Response:**
```json
{
  "success": true,
  "message": "Token balance retrieved successfully",
  "data": {
    "tokenAddress": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    "symbol": "UNI",
    "balance": "125.456",
    "walletAddress": "0x742d35Cc6634C0532925a3b8D5c5c2C"
  }
}
```

### 5. Get Token Price
**GET** `/api/dca/token/:tokenAddress/price`

```bash
GET /api/dca/token/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/price
```

**Response:**
```json
{
  "success": true,
  "message": "Token price retrieved successfully",
  "data": {
    "address": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    "symbol": "UNI",
    "price": 5.23,
    "priceUSD": "5.23",
    "timestamp": 1695808800000
  }
}
```

### 6. Get Wallet Info
**GET** `/api/dca/wallet`

```json
{
  "success": true,
  "message": "Wallet info retrieved successfully",
  "data": {
    "address": "0x742d35Cc6634C0532925a3b8D5c5c2C",
    "ethBalance": "1.234",
    "gasPrice": "0.000000020 ETH",
    "network": "mainnet"
  }
}
```

## 🤖 Cronjob Usage Examples

### Daily DCA với curl
```bash
#!/bin/bash
curl -X POST http://localhost:3000/api/dca/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tokenAddress": "0xA0b86a33E6441Cc3C07A33b1Eb9Ad6E99f0D8D8E",
    "amount": "50",
    "targetTokenAddress": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    "slippage": 1
  }'
```

### Node.js Cronjob
```javascript
const cron = require('node-cron');
const axios = require('axios');

// Chạy mỗi ngày lúc 12:00
cron.schedule('0 12 * * *', async () => {
  try {
    const response = await axios.post('http://localhost:3000/api/dca/execute', {
      tokenAddress: '0xA0b86a33E6441Cc3C07A33b1Eb9Ad6E99f0D8D8E',
      amount: '100',
      targetTokenAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      slippage: 1
    });
    
    console.log('DCA executed:', response.data);
  } catch (error) {
    console.error('DCA failed:', error.response?.data || error.message);
  }
});
```

### Python Cronjob
```python
import requests
import schedule
import time

def execute_dca():
    url = 'http://localhost:3000/api/dca/execute'
    data = {
        'tokenAddress': '0xA0b86a33E6441Cc3C07A33b1Eb9Ad6E99f0D8D8E',
        'amount': '100',
        'targetTokenAddress': '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        'slippage': 1
    }
    
    try:
        response = requests.post(url, json=data)
        print('DCA executed:', response.json())
    except Exception as e:
        print('DCA failed:', str(e))

# Chạy mỗi ngày lúc 12:00
schedule.every().day.at("12:00").do(execute_dca)

while True:
    schedule.run_pending()
    time.sleep(1)
```

## 🔒 Security Notes

- API không yêu cầu authentication để thuận tiện cronjob
- Private key được bảo vệ trong environment variables
- Validate input thoroughly
- Monitor transaction costs và slippage

## 🚀 Token Addresses (Examples)

```javascript
// Stablecoins
USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
USDC: '0xA0b86a33E6441Cc3C07A33b1Eb9Ad6E99f0D8D8E'
DAI:  '0x6B175474E89094C44Da98b954EedeAC495271d0F'

// Popular tokens
WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
UNI:  '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
LINK: '0x514910771AF9Ca656af840dff83E8264EcF986CA'
WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
```

## 📊 Error Handling

All endpoints return consistent error format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common error codes:
- `400`: Invalid request parameters
- `500`: Internal server error (blockchain/network issues)

## 🧪 Testing

```bash
# Test connection
curl http://localhost:3000/api/dca/wallet

# Test simulation (safe)
curl -X POST http://localhost:3000/api/dca/simulate \
  -H "Content-Type: application/json" \
  -d '{"tokenAddress":"0xA0b86a33E6441Cc3C07A33b1Eb9Ad6E99f0D8D8E","amount":"10","targetTokenAddress":"0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"}'
```