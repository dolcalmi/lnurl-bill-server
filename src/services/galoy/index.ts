import { request } from "graphql-request"

import { galoyConfig } from "@config"

import {
  InvalidUsernameError,
  InvoiceRequestError,
  UnknownGaloyServiceError,
} from "@domain/galoy/errors"

import { baseLogger } from "@services/logger"
import { wrapAsyncFunctionsToRunInSpan } from "@services/tracing"

import { GaloyWalletCurrency } from "@domain/galoy"

import { createBtcInvoiceMutation, createUsdInvoiceMutation, walletQuery } from "./gql"

export const GaloyService = (): IGaloyService => {
  const createInvoice = async ({
    username,
    amount,
    memo,
  }: GaloyCreateInvoiceArgs): Promise<LnInvoice | GaloyServiceError> => {
    try {
      const walletVariables = {
        username,
        walletCurrency: amount.currency,
      }
      const walletData: WalletQueryResponse = await request(
        galoyConfig.endpoint,
        walletQuery,
        walletVariables,
      )

      const recipientWalletId = walletData.wallet?.id
      if (!recipientWalletId) {
        return new InvalidUsernameError(`Invalid wallet for ${username}`)
      }

      const invoiceVariables = {
        input: {
          recipientWalletId,
          amount: amount.amount,
          memo,
        },
      }
      const createInvoiceMutation =
        amount.currency === GaloyWalletCurrency.Usd
          ? createUsdInvoiceMutation
          : createBtcInvoiceMutation
      const invoiceData: CreateInvoiceMutationResponse = await request(
        galoyConfig.endpoint,
        createInvoiceMutation,
        invoiceVariables,
      )
      const errors = invoiceData.lnInvoice?.errors
      if (errors && errors.length > 0) {
        return new InvoiceRequestError(`Error creating invoice: ${errors[0].message}`)
      }

      const invoice = invoiceData.lnInvoice?.invoice
      if (!invoice) {
        return new UnknownGaloyServiceError("Error creating invoice")
      }

      return invoice.paymentRequest
    } catch (error) {
      baseLogger.info({ error, username, amount, memo }, "Unknown galoy service error")
      return new UnknownGaloyServiceError(error.message || error)
    }
  }

  return wrapAsyncFunctionsToRunInSpan({
    namespace: "services.galoy",
    fns: {
      createInvoice,
    },
  })
}
