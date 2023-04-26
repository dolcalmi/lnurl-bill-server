import { isProd } from "@config"

import { BillService } from "@services/bill"

export const resolveSettings = async ({
  domain,
}: ResolveSettingsArgs): Promise<BillIssuer | ApplicationError> => {
  const billServiceSettings = await BillService().resolveSettings({
    domain,
    allowHttp: !isProd,
  })
  if (billServiceSettings instanceof Error) return billServiceSettings

  //TODO: add to cache

  return billServiceSettings
}
