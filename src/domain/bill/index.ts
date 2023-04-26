import { createLnurlMetadata } from "@utils"

export const BillPaymentStatus = {
  Overdue: "OVERDUE",
  Pending: "PENDING",
  Paid: "PAID",
} as const

export const areBillDetailsEqual = (bill1: Bill, bill2: Bill): boolean => {
  return (
    bill1.period === bill2.period &&
    bill1.reference === bill2.reference &&
    bill1.amount.amount === bill2.amount.amount &&
    bill1.amount.currency === bill2.amount.currency
  )
}

export const createBillMetadata = (domain: Domain, bill: Bill): string => {
  const identifier = `${bill.reference}@${domain}`
  const description = `${bill.description}`
  return createLnurlMetadata({ description, identifier })
}
