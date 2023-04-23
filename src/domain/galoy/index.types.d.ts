type GaloyServiceError = import("./errors").GaloyServiceError

type GaloyMemo = Brand<string, "GaloyMemo">
type GaloyDescriptionHash = Brand<string, "GaloyDescriptionHash">

type GaloyCreateInvoiceArgs = {
  username: LnAddress
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
  ): Promise<LnInvoiceStatus | GaloyServiceError>
}
