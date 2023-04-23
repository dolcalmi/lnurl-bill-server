import { wrapAsyncFunctionsToRunInSpan } from "@services/tracing"

import * as BillMod from "./bill"

const allFunctions = {
  Bill: { ...BillMod },
}

for (const subModuleKey in allFunctions) {
  const subModule = subModuleKey as keyof typeof allFunctions
  allFunctions[subModule] = wrapAsyncFunctionsToRunInSpan({
    namespace: `app.${subModuleKey.toLowerCase()}`,
    fns: allFunctions[subModule],
  })
}

export const { Bill } = allFunctions
