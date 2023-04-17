import { gql } from "graphql-request"

export const walletQuery = gql`
  query accountDefaultWallet($username: Username!, $walletCurrency: WalletCurrency) {
    wallet: accountDefaultWallet(username: $username, walletCurrency: $walletCurrency) {
      id
      walletCurrency
    }
  }
`

export const invoiceStatusQuery = gql`
  query LnInvoicePaymentStatus($input: LnInvoicePaymentStatusInput!) {
    lnInvoice: lnInvoicePaymentStatus(input: $input) {
      status
    }
  }
`

export const createBtcInvoiceMutation = gql`
  mutation createInvoice($input: LnInvoiceCreateOnBehalfOfRecipientInput!) {
    lnInvoice: lnInvoiceCreateOnBehalfOfRecipient(input: $input) {
      errors {
        message
      }
      invoice {
        paymentRequest
      }
    }
  }
`

export const createUsdInvoiceMutation = gql`
  mutation createInvoice($input: LnUsdInvoiceCreateOnBehalfOfRecipientInput!) {
    lnInvoice: lnUsdInvoiceCreateOnBehalfOfRecipient(input: $input) {
      errors {
        message
      }
      invoice {
        paymentRequest
      }
    }
  }
`
