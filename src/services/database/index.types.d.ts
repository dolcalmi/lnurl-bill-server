type DbBillPaymentRecord = {
  readonly domain: string
  readonly reference: string
  readonly period: string
  readonly invoice: string
  readonly invoiceStatus: string
  readonly pendingResponse: JSONObject
  readonly paidResponse?: JSONObject
  readonly notificationSentDate?: Date
}
