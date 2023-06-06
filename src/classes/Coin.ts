import { prices } from "../types/types";

export class Coin {
  id: string;
  balance: string;
  name: string;
  symbol: string;
  image: string;
  current_price?: number;
  market_cap?: number;
  market_cap_rank?: number;
  fully_diluted_valuation?: number;
  total_volume?: number;
  high_24h?: number;
  low_24h?: number;
  price_change_24h?: number;
  price_change_percentage_24h?: number;
  market_cap_change_24h?: number;
  market_cap_change_percentage_24h?: number;
  circulating_supply?: number;
  total_supply?: number;
  max_supply?: number | null;
  ath?: number;
  ath_change_percentage?: number;
  ath_date?: string;
  atl?: number;
  atl_change_percentage?: number;
  atl_date?: string;
  roi?: object | null;
  last_updated?: string;
  sparkline_in_7d: { price: number[] };
  prices: prices;
  constructor(id:string,name:string,symbol:string,image:string,balance:string){
    this.id=id
    this.name=name
    this.symbol=symbol
    this.image=image
    this.balance=balance
  
    this.sparkline_in_7d={price:[]}
    this.prices={usd:0,usd_24h_change:0,eur:0,eur_24h_change:0,btc:0,btc_24h_change:0}
  }
  getBalanceCurrency(currency:string){
    
    const pricesProp=currency as keyof Coin["prices"]
    return Number(this.balance) * (this.prices[pricesProp]??0)
  }

}
