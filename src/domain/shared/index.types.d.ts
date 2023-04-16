declare const brand: unique symbol

type Brand<T, TBrand extends string> = T & { [brand]: TBrand }

type LnInvoice = Brand<string, "LnInvoice">

type ErrorLevel =
  typeof import("./errors").ErrorLevel[keyof typeof import("./errors").ErrorLevel]

type ValidationError = import("./errors").ValidationError

type PartialResult<T> = {
  result: T | null
  error?: Error
  partialResult: true
}
