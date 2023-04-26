import toml from "toml"
import axios from "axios"

import {
  BillIssuerTomlError,
  BillIssuerTomlNotFoundError,
  BillNotFoundError,
  BillStatusUpdateError,
  InvalidBillError,
  UnknownBillServiceError,
} from "@domain/bill/errors"

import { baseLogger } from "@services/logger"
import { wrapAsyncFunctionsToRunInSpan } from "@services/tracing"
import { WalletCurrency } from "@domain/shared"
import { BillPaymentStatus } from "@domain/bill"

const TOML_SUBDOMAIN = "blink"
const TOML_FILE_NAME = "blink.toml"
const TOML_MAX_SIZE = 100 * 1024

export const BillService = (): IBillService => {
  const resolveSettings = async ({
    domain,
    allowHttp = false,
    timeoutMs = 30000,
  }: BillResolveSettingsArgs): Promise<BillIssuer | BillServiceError> => {
    const protocol = allowHttp ? "http" : "https"
    const baseUrl = `${protocol}://${TOML_SUBDOMAIN}.${domain}`
    try {
      const { status, data } = await axios.get(
        `${baseUrl}/.well-known/${TOML_FILE_NAME}`,
        {
          signal: AbortSignal.timeout(timeoutMs),
          timeout: timeoutMs,
          maxContentLength: TOML_MAX_SIZE,
        },
      )
      if (status === 404) return new BillIssuerTomlNotFoundError()
      if (status >= 400 || !data) return new BillIssuerTomlError()
      const { AUTH_PUBLIC_KEY, ORG_NAME, ORG_LN_ADDRESS, BILL_SERVER_URL, ORG_LOGO_URL } =
        toml.parse(data)

      if (!ORG_NAME || !ORG_LN_ADDRESS) {
        return new BillIssuerTomlError("Missing required settings")
      }

      return {
        domain,
        name: ORG_NAME,
        username: ORG_LN_ADDRESS as LnAddress,
        billServerUrl: BILL_SERVER_URL || `${baseUrl}/api`,
        pubkey: AUTH_PUBLIC_KEY,
        logoUrl: ORG_LOGO_URL,
      } as BillIssuer
    } catch (error) {
      baseLogger.info(
        { error, domain, allowHttp, timeoutMs, baseUrl },
        "Unknown bill service error",
      )
      return parseBillServiceError(error)
    }
  }

  const lookupByRef = async ({
    domain,
    reference,
  }: BillLookupByRefArgs): Promise<Bill | BillServiceError> => {
    try {
      const settings = await resolveSettings({ domain })
      if (settings instanceof Error) return settings

      const { status, data } = await axios.get<GetBillResponse>(
        `${settings.billServerUrl}/bills/${reference}`,
      )
      if (status === 404 || !data) return new BillNotFoundError("Bill not found")
      if (status >= 400) return new UnknownBillServiceError("Invalid data")

      const bill = translateToBill(data)
      if (bill instanceof Error) return bill
      if (bill.reference !== reference) return new InvalidBillError("Invalid reference")

      return bill
    } catch (error) {
      baseLogger.info({ error, domain, reference }, "Unknown bill service error")
      return parseBillServiceError(error)
    }
  }

  const notifyPaymentReceived = async ({
    domain,
    reference,
  }: BillNotifyPaymentReceivedArgs): Promise<Bill | BillServiceError> => {
    try {
      const settings = await resolveSettings({ domain })
      if (settings instanceof Error) return settings

      const { status, data } = await axios.put<GetBillResponse>(
        `${settings.billServerUrl}/bills/${reference}`,
        {
          status: BillPaymentStatus.Paid,
        },
      )
      if (status === 404 || !data) return new BillNotFoundError("Bill not found")
      if (status >= 400) return new UnknownBillServiceError("Invalid data")

      const bill = translateToBill(data)
      if (bill instanceof Error) return bill
      if (bill.reference !== reference) return new InvalidBillError("Invalid reference")
      if (bill.status !== BillPaymentStatus.Paid)
        return new BillStatusUpdateError("Status was not updated")

      return bill
    } catch (error) {
      baseLogger.info({ error, domain, reference }, "Unknown bill service error")
      return parseBillServiceError(error)
    }
  }

  return wrapAsyncFunctionsToRunInSpan({
    namespace: "services.bill",
    fns: {
      resolveSettings,
      lookupByRef,
      notifyPaymentReceived,
    },
  })
}

const translateToBill = (data: GetBillResponse): Bill | InvalidBillError => {
  const currencies = Object.values(WalletCurrency)
  const hasValidAmount = data.amount > 0 && currencies.includes(data.currency)
  if (!hasValidAmount) return new InvalidBillError("Invalid amount")

  const statuses = Object.values(BillPaymentStatus)
  const hasValidStatus = statuses.includes(data.status)
  if (!hasValidStatus) return new InvalidBillError("Invalid status")

  if (!data.period) return new InvalidBillError("Invalid period")

  return {
    reference: data.reference as BillRef,
    period: data.period as BillPeriod,
    amount: {
      amount: data.amount,
      currency: data.currency,
    },
    description: (data.description || "") as BillDescription,
    status: data.status,
  }
}

const parseBillServiceError = (err: Error | string) => {
  const errMsg = typeof err === "string" ? err : err.message
  const match = (knownErrDetail: RegExp): boolean => knownErrDetail.test(errMsg)

  switch (true) {
    case match(KnownBillServiceErrorMessages.InvalidTomlSize):
      return new BillIssuerTomlError(
        `blink.toml exceeds max allowed size of ${TOML_MAX_SIZE}`,
      )
    default:
      return new UnknownBillServiceError(errMsg)
  }
}

const KnownBillServiceErrorMessages = {
  InvalidTomlSize: /maxContentLength/,
} as const
