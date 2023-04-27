import { BillPaymentRepository } from "@services/database"

export const getPayment = async ({
  domain,
  period,
  reference,
}: GetPaymentArgs): Promise<BillPayment | ApplicationError> => {
  return BillPaymentRepository().find({ domain, period, reference })
}
