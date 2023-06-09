declare const brand: unique symbol

type Brand<T, TBrand extends string> = T & { [brand]: TBrand }

type JSONValue =
  | string
  | number
  | bigint
  | boolean
  | Date
  | JSONObject
  | JSONArray
  | null
  | undefined
type JSONArray = Array<JSONValue>
type JSONObject = { [key: string]: JSONValue }

type Domain = Brand<string, "Domain">
type LnAddress = Brand<string, "LnAddress">
type LnInvoice = Brand<string, "LnInvoice">

type WalletCurrency =
  typeof import("./index").WalletCurrency[keyof typeof import("./index").WalletCurrency]
type LnInvoiceStatus =
  typeof import("./index").LnInvoiceStatus[keyof typeof import("./index").LnInvoiceStatus]

type WalletAmount<T extends WalletCurrency> = {
  currency: T
  amount: bigint
}

type BtcSatsWalletAmount = WalletAmount<"BTC">
type UsdCentsWalletAmount = WalletAmount<"USD">

type ErrorLevel =
  typeof import("./errors").ErrorLevel[keyof typeof import("./errors").ErrorLevel]

type JobError = import("./errors").JobError
type ValidationError = import("./errors").ValidationError

type PartialResult<T> = {
  result: T | null
  error?: Error
  partialResult: true
}

interface IJob {
  start(): void | JobError
  stop(): void | JobError
}
