type CreatePaymentArgs = {
  domain: Domain
  reference: BillRef
}

type GetPaymentArgs = {
  domain: Domain
  period: BillPeriod
  reference: BillRef
}

type ResolveSettingsArgs = {
  domain: Domain
}
