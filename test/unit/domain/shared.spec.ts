import {
  InvalidLnInvoiceStatusError,
  LnInvoiceStatus,
  toLnInvoiceStatus,
} from "@domain/shared"

describe("toLnInvoiceStatus", () => {
  test("should return LnInvoiceStatus for valid status strings", () => {
    let status = "EXPIRED"
    let result = toLnInvoiceStatus(status)
    expect(result).toBe(LnInvoiceStatus.Expired)

    status = "PENDING"
    result = toLnInvoiceStatus(status)
    expect(result).toBe(LnInvoiceStatus.Pending)

    status = "PAID"
    result = toLnInvoiceStatus(status)
    expect(result).toBe(LnInvoiceStatus.Paid)
  })

  test("should throw InvalidStatusError for invalid status strings", () => {
    const invalidStatus = "InvalidStatus"
    const result = toLnInvoiceStatus(invalidStatus)
    expect(result).toBeInstanceOf(InvalidLnInvoiceStatusError)
  })
})
