import { GaloyInvoiceStatus, toGaloyInvoiceStatus } from "@domain/galoy"
import { InvalidStatusError } from "@domain/galoy/errors"

describe("toGaloyInvoiceStatus", () => {
  test("should return GaloyInvoiceStatus for valid status strings", () => {
    let status = "EXPIRED"
    let result = toGaloyInvoiceStatus(status)
    expect(result).toBe(GaloyInvoiceStatus.Expired)

    status = "PENDING"
    result = toGaloyInvoiceStatus(status)
    expect(result).toBe(GaloyInvoiceStatus.Pending)

    status = "PAID"
    result = toGaloyInvoiceStatus(status)
    expect(result).toBe(GaloyInvoiceStatus.Paid)
  })

  test("should throw InvalidStatusError for invalid status strings", () => {
    const invalidStatus = "InvalidStatus"
    const result = toGaloyInvoiceStatus(invalidStatus)
    expect(result).toBeInstanceOf(InvalidStatusError)
  })
})
