import { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("bill_payments", (table) => {
    table.string("domain").notNullable()
    table.string("reference").notNullable()
    table.string("period").notNullable()
    table.string("invoice").notNullable()
    table.enum("invoiceStatus", ["EXPIRED", "PENDING", "PAID"]).notNullable()
    table.json("pendingResponse").notNullable()
    table.json("paidResponse")
    table.timestamp("notificationSentDate")
    table.timestamps(true, true)

    // Set primary key
    table.primary(["domain", "reference", "period"])
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("bill_payments")
}
