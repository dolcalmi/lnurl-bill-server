type GetBillResponse = {
  reference: string
  period: string
  amount: bigint
  currency: WalletCurrency
  description: string
  status: BillPaymentStatus
}
