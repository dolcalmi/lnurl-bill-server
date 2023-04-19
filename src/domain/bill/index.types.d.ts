type BillServiceError = import("./errors").BillServiceError

type BillIssuerPubKey = Brand<string, "BillIssuerPubKey">
type BillRef = Brand<string, "BillRef">
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
  description: BillDescription
  amount: BtcSatsWalletAmount | UsdCentsWalletAmount
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

interface IBillService {
  resolveSettings(args: BillResolveSettingsArgs): Promise<BillIssuer | BillServiceError>
  lookupByRef(args: BillLookupByRefArgs): Promise<Bill | BillServiceError>
}
