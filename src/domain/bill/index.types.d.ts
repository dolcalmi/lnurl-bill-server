type BillServiceError = import("./errors").BillServiceError
type BillPaymentStatus =
  typeof import("./index").BillPaymentStatus[keyof typeof import("./index").BillPaymentStatus]

type BillIssuerPubKey = Brand<string, "BillIssuerPubKey">
type BillRef = Brand<string, "BillRef">
type BillPeriod = Brand<string, "BillPeriod">
type BillDescription = Brand<string, "BillDescription">

type BillIssuer = {
  domain: Domain
  name: string
  billServerUrl: string
  pubkey?: BillIssuerPubKey
  logoUrl?: string
}

type Bill = {
  reference: BillRef
  period: BillPeriod
  description: BillDescription
  amount: BtcSatsWalletAmount | UsdCentsWalletAmount
  status: BillPaymentStatus
}

type BillResolveSettingsArgs = {
  domain: Domain
  allowHttp?: boolean
  timeoutMs?: number
}

type BillLookupByRefArgs = {
  reference: BillRef
  domain: Domain
}

type BillNotifyPaymentReceivedArgs = {
  reference: BillRef
  domain: Domain
}

interface IBillService {
  resolveSettings(args: BillResolveSettingsArgs): Promise<BillIssuer | BillServiceError>
  lookupByRef(args: BillLookupByRefArgs): Promise<Bill | BillServiceError>
  notifyPaymentReceived(
    args: BillNotifyPaymentReceivedArgs,
  ): Promise<true | BillServiceError>
}
