import { UnknownGaloyServiceError } from "@domain/galoy/errors"

import { baseLogger } from "@services/logger"
import { wrapAsyncFunctionsToRunInSpan } from "@services/tracing"

export const PriceService = (): IGaloyService => {
  const createInvoice = async ({
    username,
    amount,
    memo,
  }: GaloyCreateInvoiceArgs): Promise<LnInvoice | GaloyServiceError> => {
    baseLogger.info({ username, amount, memo }, "Invoice data")
    return new UnknownGaloyServiceError("not implemented")
  }

  return wrapAsyncFunctionsToRunInSpan({
    namespace: "services.galoy",
    fns: {
      createInvoice,
    },
  })
}
