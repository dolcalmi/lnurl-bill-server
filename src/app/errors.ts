import * as SharedErrors from "@domain/shared/errors"
import * as BillErrors from "@domain/bill/errors"
import * as BillPaymentErrors from "@domain/bill-payment/errors"
import * as GaloyErrors from "@domain/galoy/errors"

export const ApplicationErrors = {
  ...SharedErrors,
  ...BillErrors,
  ...BillPaymentErrors,
  ...GaloyErrors,
} as const
