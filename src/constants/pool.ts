import { CHAIN_ID_SUPPORT } from './chain'
import { Address } from 'viem'

export const DATA_UNISWAP = {
  [CHAIN_ID_SUPPORT[56]]: {
    uniswapPosition: '0x7b8A01B39D58278b5DE7e48c8449c9f4F5170613' as Address, //NonfungiblePositionManager
    factoryAddress: '0xdB1d10011AD0Ff90774D0C6Bb92e5C5c8b4461F7' as Address, //UniswapV3Factory
    //SwapRouter02 in Uniswap  
    // https://docs.uniswap.org/contracts/v3/reference/deployments/bnb-deployments
    routerAddress: '0xB971eF87ede563556b2ED4b1C0b0019111Dd85d2' as Address,
    // wrapTokenNative: '0x4200000000000000000000000000000000000006' as Address,
    gasAddPosition: 2000000,
    quoterV2: '0x78D78E420Da98ad378D7799bE8f4AF69033EB077' as Address //QuoterV2
  },
  [CHAIN_ID_SUPPORT[8453]]: {
    uniswapPosition: '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1' as Address, //NonfungiblePositionManager
    factoryAddress: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD' as Address, //UniswapV3Factory
    //SwapRouter02 in Uniswap  
    //https://docs.uniswap.org/contracts/v3/reference/deployments/base-deployments
    routerAddress: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a' as Address, //Uniswap V3 SwapRouter on Base
    // wrapTokenNative: '0x4200000000000000000000000000000000000006' as Address,
    gasAddPosition: 2000000,
    quoterV2: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a' as Address //QuoterV2
  }

}



export const POOL_UNISWAP = {
  [CHAIN_ID_SUPPORT[56]]: {
    500: {
      address: '0x16eE3A99f4bCa5c0f4c2eA6d4b4B8f2F3F2E1aD5' as Address
    }
  },
  [CHAIN_ID_SUPPORT[8453]]: {
    500: {
      address: '0xd0b53D9277642d899DF5C87A3966A349A798F224' as Address
    }
  }

}

