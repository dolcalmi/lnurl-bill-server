type GetBillResponse = {
  reference: string
  amount: bigint
  currency: WalletCurrency
  description: string
  status: BillPaymentStatus
}
