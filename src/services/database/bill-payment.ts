import {
  BillPaymentNotFoundRepositoryError,
  BillPaymentNotPersistedRepositoryError,
  BillPaymentNotUpdatedRepositoryError,
  UnknownBillPaymentRepositoryError,
} from "@domain/bill-payment/errors"

import { wrapAsyncFunctionsToRunInSpan } from "@services/tracing"

import { baseLogger } from "@services/logger"
import { DbConnectionError, LnInvoiceStatus } from "@domain/shared"

import { queryBuilder } from "./query-builder"

const tableName = "bill_payments"

export const BillPaymentRepository = (): IBillPaymentRepository => {
  const find = async ({
    domain,
    reference,
    period,
  }: BillPaymentFindArgs): Promise<BillPayment | BillPaymentRepositoryError> => {
    try {
      const billPayment = await queryBuilder(tableName)
        .select()
        .where({ domain, reference, period })
        .first<DbBillPaymentRecord | undefined>()
      if (!billPayment) return new BillPaymentNotFoundRepositoryError()

      return dbRecordToBillPayment(billPayment)
    } catch (error) {
      baseLogger.info(
        { error, domain, reference, period },
        "Unknown bill payment repository error",
      )
      return parseBillPaymentRepositoryError(error)
    }
  }

  const yieldPending = async function* ({
    limit = 100,
    offset = 0,
  }: BillPaymentYieldPendingArgs): AsyncGenerator<
    BillPayment | BillPaymentRepositoryError
  > {
    let hasNextPage = true
    let currentOffset = offset

    while (hasNextPage) {
      try {
        const billPayments = await queryBuilder<DbBillPaymentRecord>(tableName)
          .select()
          .where({ invoiceStatus: LnInvoiceStatus.Pending })
          .orderBy("created_at")
          .limit(limit)
          .offset(currentOffset)

        if (billPayments.length < limit) {
          hasNextPage = false
        }

        for (const billPayment of billPayments) {
          yield dbRecordToBillPayment(billPayment)
        }

        currentOffset += limit
      } catch (error) {
        hasNextPage = false
        baseLogger.info({ error, limit, offset }, "Unknown bill payment repository error")
        yield parseBillPaymentRepositoryError(error)
      }
    }
  }

  const persistNew = async (
    billPayment: BillPayment,
  ): Promise<BillPayment | BillPaymentRepositoryError> => {
    try {
      const serializedBillPayment = serializeBillPayment(billPayment)
      const result = await queryBuilder(tableName).insert(serializedBillPayment)

      const persisted = result && result[0] === 1
      if (!persisted) return new BillPaymentNotPersistedRepositoryError()

      return billPayment
    } catch (error) {
      baseLogger.info({ error, billPayment }, "Unknown bill payment repository error")
      return parseBillPaymentRepositoryError(error)
    }
  }

  const update = async (
    billPayment: BillPayment,
  ): Promise<BillPayment | BillPaymentRepositoryError> => {
    try {
      const { domain, reference, period } = billPayment
      const result = await queryBuilder(tableName)
        .where({ domain, reference, period })
        .andWhereNot("invoiceStatus", LnInvoiceStatus.Paid)
        .update(serializeBillPayment(billPayment))

      if (result === 0) return new BillPaymentNotUpdatedRepositoryError()

      return billPayment
    } catch (error) {
      baseLogger.info({ error, billPayment }, "Unknown bill payment repository error")
      return parseBillPaymentRepositoryError(error)
    }
  }

  return wrapAsyncFunctionsToRunInSpan({
    namespace: "services.database.billPayment",
    fns: {
      find,
      yieldPending,
      persistNew,
      update,
    },
  })
}

const serializeBillPayment = (billPayment: BillPayment): JSONObject => {
  return {
    ...billPayment,
    pendingResponse: serializeBill(billPayment.pendingResponse),
    paidResponse: billPayment.paidResponse
      ? serializeBill(billPayment.paidResponse)
      : undefined,
  }
}

const serializeBill = (bill: Bill): JSONObject => {
  return {
    ...bill,
    amount: {
      ...bill.amount,
      amount: `${bill.amount.amount}`,
    },
  }
}

const dbRecordToBillPayment = (result: DbBillPaymentRecord): BillPayment => ({
  domain: result.domain as Domain,
  reference: result.reference as BillRef,
  period: result.period as BillPeriod,
  invoice: result.invoice as LnInvoice,
  invoiceStatus: result.invoiceStatus as LnInvoiceStatus,
  pendingResponse: toBill(result.pendingResponse),
  paidResponse: result.paidResponse ? toBill(result.paidResponse) : undefined,
  notificationSentDate: result.notificationSentDate
    ? new Date(result.notificationSentDate)
    : undefined,
})

const toBill = (json: JSONObject): Bill => ({
  reference: json.reference as BillRef,
  period: json.period as BillPeriod,
  amount: {
    amount: BigInt(`${json.amount}`),
    currency: json.currency as WalletCurrency,
  },
  description: (json.description || "") as BillDescription,
  status: json.status as BillPaymentStatus,
})

const parseBillPaymentRepositoryError = (
  err: Error | string,
): BillPaymentRepositoryError => {
  const errMsg = typeof err === "string" ? err : err.message
  const match = (knownErrDetail: RegExp): boolean => knownErrDetail.test(errMsg)

  switch (true) {
    case match(KnownDbErrorDetails.InvalidDatabase):
    case match(KnownDbErrorDetails.InvalidConnection):
    case match(KnownDbErrorDetails.InvalidCredentials):
      return new DbConnectionError(errMsg)
    default:
      return new UnknownBillPaymentRepositoryError(errMsg)
  }
}

const KnownDbErrorDetails = {
  InvalidConnection: /ECONNREFUSED/,
  InvalidCredentials: /28P01/,
  InvalidDatabase: /3D000/,
} as const
