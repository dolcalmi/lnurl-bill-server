type WalletQueryResponse = {
  wallet?: {
    id: string
    walletCurrency: string
  }
}

type InvoiceStatusQueryResponse = {
  lnInvoice?: {
    status: string
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

type GraphQlErrorResponse = {
  response?: {
    errors?: {
      message: string
    }[]
  }
}
