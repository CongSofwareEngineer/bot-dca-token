import { BigNumber } from 'bignumber.js'
import HistoryBuyService from '../historyBuy'
import { HistoryBuy } from '../historyBuy/type'
import { DcaTokenConfig } from './type'

class DcaTokenService extends HistoryBuyService {
  private config: DcaTokenConfig
  constructor(config: DcaTokenConfig, historyBuy: HistoryBuy) {
    super(historyBuy)
    this.config = config
  }

  async getAmountByStep() {
    try {

    } catch (error) {

    }
  }
}


export default DcaTokenService