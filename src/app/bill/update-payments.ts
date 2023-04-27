import {
  BillAlreadyPaidError,
  BillExpiredError,
  BillNoUpdateNeededError,
} from "@domain/bill/errors"
import { LnInvoiceStatus } from "@domain/shared"

import { BillService } from "@services/bill"
import { baseLogger } from "@services/logger"
import { GaloyService } from "@services/galoy"
import { BillPaymentRepository } from "@services/database"
import { recordExceptionInCurrentSpan, wrapAsyncToRunInSpan } from "@services/tracing"

export const updatePayments = async (): Promise<number | ApplicationError> => {
  const billPaymentIterator = BillPaymentRepository().yieldPending({})
  let updatedCount = 0
  for await (const billPayment of billPaymentIterator) {
    if (billPayment instanceof Error) {
      recordExceptionInCurrentSpan({ error: billPayment })
      continue
    }

    const updateResult = await updatePayment(billPayment)
    if (updateResult instanceof Error) {
      recordExceptionInCurrentSpan({ error: updateResult })
      baseLogger.error({ error: updateResult, billPayment }, "Failed to update payment")
      continue
    }
    updatedCount += 1
    baseLogger.info({ billPayment }, "Payment updated successfully")
  }

  return updatedCount
}

export const updatePayment = wrapAsyncToRunInSpan({
  namespace: "app.bill",
  fnName: "updatePayment",
  fn: async (billPayment: BillPayment): Promise<true | ApplicationError> => {
    const { domain, reference, invoice, invoiceStatus } = billPayment

    if (invoiceStatus === LnInvoiceStatus.Expired) return new BillExpiredError()
    if (invoiceStatus === LnInvoiceStatus.Paid) return new BillAlreadyPaidError()

    const currentStatus = await GaloyService().checkInvoiceStatus({ invoice })
    if (currentStatus instanceof Error) return currentStatus
    if (currentStatus === LnInvoiceStatus.Pending) return new BillNoUpdateNeededError()

    let paidResponse: Bill | undefined
    let notificationSentDate: Date | undefined
    if (currentStatus === LnInvoiceStatus.Paid) {
      const bill = await BillService().notifyPaymentReceived({ domain, reference })
      if (bill instanceof Error) return bill

      paidResponse = bill
      notificationSentDate = new Date(Date.now())
    }

    const billPaymentToUpdate = { ...billPayment }
    billPaymentToUpdate.invoiceStatus = currentStatus
    billPaymentToUpdate.paidResponse = paidResponse
    billPaymentToUpdate.notificationSentDate = notificationSentDate

    const updated = await BillPaymentRepository().update(billPaymentToUpdate)
    if (updated instanceof Error) return updated

    return true
  },
})
