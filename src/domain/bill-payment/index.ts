export const isBillPayment = (obj: unknown): obj is BillPayment => {
  const billPayment = <BillPayment>obj
  return (
    billPayment.domain !== undefined &&
    billPayment.period !== undefined &&
    billPayment.reference !== undefined &&
    billPayment.invoice !== undefined &&
    billPayment.invoiceStatus !== undefined &&
    billPayment.pendingResponse !== undefined
  )
}
