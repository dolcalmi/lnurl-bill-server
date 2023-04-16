type WalletQueryResponse = {
  wallet?: {
    id: string
    walletCurrency: string
  }
}
type CreateInvoiceMutationResponse = {
  lnInvoice?: {
    errors?: {
      message: string
    }[]
    invoice?: {
      paymentRequest: LnInvoice
    }
  }
}
