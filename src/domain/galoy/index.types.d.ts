type GaloyServiceError = import("./errors").GaloyServiceError

type GaloyWalletCurrency =
  typeof import("./index").GaloyWalletCurrency[keyof typeof import("./index").GaloyWalletCurrency]

type GaloyWalletAmount<T extends GaloyWalletCurrency> = {
  currency: T
  amount: bigint
}

type GaloyBTCWalletAmount = GaloyWalletAmount<"BTC">
type GaloyUSDWalletAmount = GaloyWalletAmount<"USD">

type GaloyUsername = Brand<string, "GaloyUsername">
type GaloyMemo = Brand<string, "GaloyMemo">

type GaloyCreateInvoiceArgs = {
  username: GaloyUsername
  amount: GaloyBTCWalletAmount | GaloyUSDWalletAmount
  memo: GaloyMemo
}

interface IGaloyService {
  createInvoice(args: GaloyCreateInvoiceArgs): Promise<LnInvoice | GaloyServiceError>
}
