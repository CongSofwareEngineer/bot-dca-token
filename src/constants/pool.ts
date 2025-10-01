import { CHAIN_ID_SUPPORT } from './chain'
import { Address } from 'viem'

export const DATA_UNISWAP = {
  [CHAIN_ID_SUPPORT.Bsc]: {
    uniswapPosition: '0x7b8A01B39D58278b5DE7e48c8449c9f4F5170613' as Address, //NonfungiblePositionManager
    factoryAddress: '0xdB1d10011AD0Ff90774D0C6Bb92e5C5c8b4461F7' as Address, //UniswapV3Factory
    //SwapRouter02 in Uniswap  
    // https://docs.uniswap.org/contracts/v3/reference/deployments/bnb-deployments
    routerAddress: '0xB971eF87ede563556b2ED4b1C0b0019111Dd85d2' as Address,
    // wrapTokenNative: '0x4200000000000000000000000000000000000006' as Address,
    gasAddPosition: 2000000
  },
  [CHAIN_ID_SUPPORT.Base]: {
    uniswapPosition: '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1' as Address, //NonfungiblePositionManager
    factoryAddress: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD' as Address, //UniswapV3Factory
    //SwapRouter02 in Uniswap  
    //https://docs.uniswap.org/contracts/v3/reference/deployments/base-deployments
    routerAddress: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a' as Address, //Uniswap V3 SwapRouter on Base
    // wrapTokenNative: '0x4200000000000000000000000000000000000006' as Address,
    gasAddPosition: 2000000
  }

}