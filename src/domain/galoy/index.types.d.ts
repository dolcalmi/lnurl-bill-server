type GaloyServiceError = import("./errors").GaloyServiceError

type GaloyInvoiceStatus =
  typeof import("./index").GaloyInvoiceStatus[keyof typeof import("./index").GaloyInvoiceStatus]

type GaloyUsername = Brand<string, "GaloyUsername">
type GaloyMemo = Brand<string, "GaloyMemo">
type GaloyDescriptionHash = Brand<string, "GaloyDescriptionHash">

type GaloyCreateInvoiceArgs = {
  username: GaloyUsername
  amount: BtcSatsWalletAmount | UsdCentsWalletAmount
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
