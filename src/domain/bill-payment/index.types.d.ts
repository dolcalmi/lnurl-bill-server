type BillPaymentRepositoryError = import("./errors").BillPaymentRepositoryError

type BillPayment = {
  domain: Domain
  reference: BillRef
  period: BillPeriod
  invoice: LnInvoice
  invoiceStatus: LnInvoiceStatus
  pendingResponse: Bill
  paidResponse?: Bill
  notificationSentDate?: Date
}

type BillPaymentFindArgs = {
  domain: Domain
  reference: BillRef
  period: BillPeriod
}

type BillPaymentYieldPendingArgs = {
  limit?: number
  offset?: number
}

interface IBillPaymentRepository {
  find(args: BillPaymentFindArgs): Promise<BillPayment | BillPaymentRepositoryError>
  yieldPending: (
    args: BillPaymentYieldPendingArgs,
  ) => AsyncGenerator<BillPayment | BillPaymentRepositoryError>
  persistNew(args: BillPayment): Promise<BillPayment | BillPaymentRepositoryError>
  update(args: BillPayment): Promise<BillPayment | BillPaymentRepositoryError>
}
