import { LnInvoiceStatus } from "@domain/shared"
import { isBillPayment } from "@domain/bill-payment"
import { BillAlreadyPaidError, BillOverdueError } from "@domain/bill/errors"
import { BillPaymentNotFoundRepositoryError } from "@domain/bill-payment/errors"

import { BillService } from "@services/bill"
import { GaloyService } from "@services/galoy"
import { BillPaymentRepository } from "@services/database"
import { BillPaymentStatus, areBillDetailsEqual } from "@domain/bill"

export const createPayment = async ({
  domain,
  reference,
  descriptionHash,
  memo,
}: CreatePaymentArgs): Promise<BillPayment | ApplicationError> => {
  const billService = BillService()
  const galoyService = GaloyService()
  const billPaymentRepo = BillPaymentRepository()

  const bill = await billService.lookupByRef({ domain, reference })
  if (bill instanceof Error) return bill
  if (bill.status === BillPaymentStatus.Overdue) return new BillOverdueError()

  const billPayment = await billPaymentRepo.find({
    domain,
    period: bill.period,
    reference: bill.reference,
  })
  const notFound = billPayment instanceof BillPaymentNotFoundRepositoryError
  if (billPayment instanceof Error && !notFound) return billPayment

  if (isBillPayment(billPayment)) {
    if (billPayment.invoiceStatus === LnInvoiceStatus.Paid)
      return new BillAlreadyPaidError()

    if (billPayment.invoiceStatus === LnInvoiceStatus.Pending) {
      const currentStatus = await galoyService.checkInvoiceStatus({
        invoice: billPayment.invoice,
      })
      if (currentStatus instanceof Error) return currentStatus

      if (currentStatus === LnInvoiceStatus.Paid) return new BillAlreadyPaidError()
      if (
        currentStatus === LnInvoiceStatus.Pending &&
        areBillDetailsEqual(bill, billPayment.pendingResponse)
      )
        return billPayment
    }
  }

  const billServiceSettings = await billService.resolveSettings({ domain })
  if (billServiceSettings instanceof Error) return billServiceSettings

  const invoice = await galoyService.createInvoice({
    username: billServiceSettings.username,
    amount: bill.amount,
    memo: (memo || bill.description) as GaloyMemo,
    descriptionHash,
  })
  if (invoice instanceof Error) return invoice

  if (notFound) {
    return billPaymentRepo.persistNew({
      domain,
      period: bill.period,
      reference: bill.reference,
      invoice,
      invoiceStatus: LnInvoiceStatus.Pending,
      pendingResponse: bill,
    })
  }

  // should not happen, ts error
  if (billPayment instanceof Error) return billPayment

  billPayment.invoice = invoice
  billPayment.invoiceStatus = LnInvoiceStatus.Pending
  billPayment.pendingResponse = bill

  return billPaymentRepo.update(billPayment)
}
