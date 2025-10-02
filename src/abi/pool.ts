export const V3_POOL_ABI = [
  {
    inputs: [],
    name: 'slot0',
    outputs: [
      { internalType: 'uint160', name: 'sqrtPriceX96', type: 'uint160' },
      { internalType: 'int24', name: 'tick', type: 'int24' },
      { internalType: 'uint16', name: 'observationIndex', type: 'uint16' },
      { internalType: 'uint16', name: 'observationCardinality', type: 'uint16' },
      { internalType: 'uint16', name: 'observationCardinalityNext', type: 'uint16' },
      { internalType: 'uint8', name: 'feeProtocol', type: 'uint8' },
      { internalType: 'bool', name: 'unlocked', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  { inputs: [], name: 'token0', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'token1', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'liquidity', outputs: [{ internalType: 'uint128', name: '', type: 'uint128' }], stateMutability: 'view', type: 'function' },
  {
    inputs: [],
    name: 'fee',
    outputs: [{ internalType: 'uint24', name: '', type: 'uint24' }],
    stateMutability: 'view',
    type: 'function'
  },
  // ERC20 decimals & symbol
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

export const V3_FACTORY_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'tokenA', type: 'address' },
      { internalType: 'address', name: 'tokenB', type: 'address' },
      { internalType: 'uint24', name: 'fee', type: 'uint24' }
    ],
    name: 'getPool',
    outputs: [{ internalType: 'address', name: 'pool', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const


export const V3_SWAP_ROUTER_ABI = [
  {
    name: 'exactInputSingle',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'deadline', type: 'uint256' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' }
        ],
        internalType: 'struct ISwapRouter.ExactInputSingleParams',
        name: 'params',
        type: 'tuple'
      }
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }]
  },
  {
    name: 'exactOutputSingle',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'deadline', type: 'uint256' },
          { name: 'amountOut', type: 'uint256' },
          { name: 'amountInMaximum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' }
        ],
        internalType: 'struct ISwapRouter.ExactOutputSingleParams',
        name: 'params',
        type: 'tuple'
      }
    ],
    outputs: [{ name: 'amountIn', type: 'uint256' }]
  }
] as const


export const QUOTER_V2_ABI = [
  {
    name: 'quoteExactInputSingle',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      {
        components: [
          { name: 'tokenIn', type: 'address', internalType: 'address' },
          { name: 'tokenOut', type: 'address', internalType: 'address' },
          { name: 'amountIn', type: 'uint256', internalType: 'uint256' },
          { name: 'fee', type: 'uint24', internalType: 'uint24' },
          { name: 'sqrtPriceLimitX96', type: 'uint160', internalType: 'uint160' }
        ],
        name: 'params',
        type: 'tuple',
        internalType: 'struct IQuoterV2.QuoteExactInputSingleParams'
      }
    ],
    outputs: [
      { name: 'amountOut', type: 'uint256', internalType: 'uint256' },
      { name: 'sqrtPriceX96After', type: 'uint160', internalType: 'uint160' },
      { name: 'initializedTicksCrossed', type: 'uint32', internalType: 'uint32' },
      { name: 'gasEstimate', type: 'uint256', internalType: 'uint256' }
    ]
  },
  {
    'inputs': [
      {
        'components': [
          {
            'internalType': 'address',
            'name': 'tokenIn',
            'type': 'address'
          },
          {
            'internalType': 'address',
            'name': 'tokenOut',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'amount',
            'type': 'uint256'
          },
          {
            'internalType': 'uint24',
            'name': 'fee',
            'type': 'uint24'
          },
          {
            'internalType': 'uint160',
            'name': 'sqrtPriceLimitX96',
            'type': 'uint160'
          }
        ],
        'internalType': 'struct IQuoterV2.QuoteExactOutputSingleParams',
        'name': 'params',
        'type': 'tuple'
      }
    ],
    'name': 'quoteExactOutputSingle',
    'outputs': [
      {
        'internalType': 'uint256',
        'name': 'amountIn',
        'type': 'uint256'
      },
      {
        'internalType': 'uint160',
        'name': 'sqrtPriceX96After',
        'type': 'uint160'
      },
      {
        'internalType': 'uint32',
        'name': 'initializedTicksCrossed',
        'type': 'uint32'
      },
      {
        'internalType': 'uint256',
        'name': 'gasEstimate',
        'type': 'uint256'
      }
    ],
    'stateMutability': 'nonpayable',
    'type': 'function'
  }
] as const