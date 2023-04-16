export * from "./process"

export const galoyConfig: GaloyConfig = {
  endpoint: process.env.GALOY_ENDPOINT || "https://api.staging.galoy.io/graphql",
}
