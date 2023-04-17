type GaloyServiceError = import("./errors").GaloyServiceError

type GaloyWalletCurrency =
  typeof import("./index").GaloyWalletCurrency[keyof typeof import("./index").GaloyWalletCurrency]

type GaloyInvoiceStatus =
  typeof import("./index").GaloyInvoiceStatus[keyof typeof import("./index").GaloyInvoiceStatus]

type GaloyWalletAmount<T extends GaloyWalletCurrency> = {
  currency: T
  amount: bigint
}

type GaloyBTCWalletAmount = GaloyWalletAmount<"BTC">
type GaloyUSDWalletAmount = GaloyWalletAmount<"USD">

type GaloyUsername = Brand<string, "GaloyUsername">
type GaloyMemo = Brand<string, "GaloyMemo">
type GaloyDescriptionHash = Brand<string, "GaloyDescriptionHash">

type GaloyCreateInvoiceArgs = {
  username: GaloyUsername
  amount: GaloyBTCWalletAmount | GaloyUSDWalletAmount
  memo?: GaloyMemo
  descriptionHash?: GaloyDescriptionHash
}

type GaloyCheckInvoiceStatusArgs = {
  invoice: LnInvoice
}

interface IGaloyService {
  createInvoice(args: GaloyCreateInvoiceArgs): Promise<LnInvoice | GaloyServiceError>
  checkInvoiceStatus(
    args: GaloyCheckInvoiceStatusArgs,
  ): Promise<GaloyInvoiceStatus | GaloyServiceError>
}
