import { Address, formatUnits, parseGwei, parseUnits } from 'viem'

export const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj))


export const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const isNativeToken = (tokenAddress: Address): boolean => {
  return tokenAddress === '0x0000000000000000000000000000000000000000' ||
    tokenAddress === '0x000000000000000000000000000000000000dead' ||
    tokenAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' ||
    tokenAddress === '0x0000000000000000000000000000000000001010'
}


export const convertWeiToBalance = (value: string | bigint, decimals: number = 18): string => {
  return formatUnits(BigInt(value.toString()), decimals).toString()
}

export const convertBalanceToWei = (value: string | bigint, decimals: number = 18): string => {
  return parseUnits(value.toString(), decimals).toString()
}

