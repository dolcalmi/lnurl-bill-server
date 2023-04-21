import database from "./database"

export * from "./process"

export const databaseClientConfig = database

export const galoyConfig: GaloyConfig = {
  endpoint: process.env.GALOY_ENDPOINT || "https://api.staging.galoy.io/graphql",
}
