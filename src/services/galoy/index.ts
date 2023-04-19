import { request } from "graphql-request"

import { galoyConfig } from "@config"

import {
  InvalidInvoiceError,
  InvalidUsernameError,
  InvoiceRequestError,
  UnknownGaloyServiceError,
} from "@domain/galoy/errors"
import { WalletCurrency } from "@domain/shared"
import { toGaloyInvoiceStatus } from "@domain/galoy"

import { baseLogger } from "@services/logger"
import { wrapAsyncFunctionsToRunInSpan } from "@services/tracing"

import {
  createBtcInvoiceMutation,
  createUsdInvoiceMutation,
  invoiceStatusQuery,
  walletQuery,
} from "./gql"

export const GaloyService = (): IGaloyService => {
  const createInvoice = async ({
    username,
    amount,
    memo,
    descriptionHash,
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
          amount: Number(amount.amount),
          memo,
          descriptionHash,
        },
      }
      const createInvoiceMutation =
        amount.currency === WalletCurrency.UsdCents
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
      baseLogger.info(
        { error, username, amount, memo, descriptionHash },
        "Unknown galoy service error",
      )
      return parseGaloyServiceError(error)
    }
  }

  const checkInvoiceStatus = async ({
    invoice,
  }: GaloyCheckInvoiceStatusArgs): Promise<GaloyInvoiceStatus | GaloyServiceError> => {
    try {
      const variables = {
        input: {
          paymentRequest: invoice,
        },
      }

      const invoiceData: InvoiceStatusQueryResponse = await request(
        galoyConfig.endpoint,
        invoiceStatusQuery,
        variables,
      )

      const status = invoiceData.lnInvoice?.status
      if (!status) {
        return new UnknownGaloyServiceError("Error getting invoice status")
      }

      return toGaloyInvoiceStatus(status)
    } catch (error) {
      baseLogger.info({ error, invoice }, "Unknown galoy service error")
      return parseGaloyServiceError(error)
    }
  }

  return wrapAsyncFunctionsToRunInSpan({
    namespace: "services.galoy",
    fns: {
      createInvoice,
      checkInvoiceStatus,
    },
  })
}

export const parseGaloyServiceError = (err: Error | string) => {
  const parseError = () => {
    if (typeof err === "string") {
      return err
    }

    const gqlError = err as GraphQlErrorResponse
    if (gqlError.response && gqlError.response.errors) {
      const errors = gqlError.response.errors
      return (errors.length > 0 && errors[0].message) || ""
    }

    return err.message
  }

  const errMsg = parseError()
  const match = (knownErrDetail: RegExp): boolean => knownErrDetail.test(errMsg)

  switch (true) {
    case match(KnownGaloyServiceErrorMessages.InvalidUsername):
      return new InvalidUsernameError()
    case match(KnownGaloyServiceErrorMessages.InvalidPaymentRequest):
      return new InvalidInvoiceError()
    default:
      return new UnknownGaloyServiceError(errMsg)
  }
}

const KnownGaloyServiceErrorMessages = {
  InvalidPaymentRequest: /Invalid value for LnPaymentRequest/,
  InvalidUsername: /Account does not exist for username/,
} as const
