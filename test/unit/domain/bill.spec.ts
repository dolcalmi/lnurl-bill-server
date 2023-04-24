import { BillPaymentStatus, areBillDetailsEqual } from "@domain/bill"
import { WalletCurrency } from "@domain/shared"

describe("areBillDetailsEqual", () => {
  const bill1 = {
    reference: "12345" as BillRef,
    period: "2023-04" as BillPeriod,
    amount: {
      amount: 1000n,
      currency: WalletCurrency.BtcSats,
    } as BtcSatsWalletAmount,
    description: "description-1",
    status: BillPaymentStatus.Pending,
  } as Bill

  test("returns true for equal bills", () => {
    const bill2 = { ...bill1 }
    expect(areBillDetailsEqual(bill1, bill2)).toBe(true)
  })

  test("returns false for bills with different details", () => {
    let bill2: Bill = { ...bill1, reference: "diff-ref" as BillRef }
    expect(areBillDetailsEqual(bill1, bill2)).toBe(false)

    bill2 = { ...bill1, period: "2023-05" as BillPeriod }
    expect(areBillDetailsEqual(bill1, bill2)).toBe(false)

    bill2 = {
      ...bill1,
      amount: {
        amount: 2000n,
        currency: WalletCurrency.BtcSats,
      } as BtcSatsWalletAmount,
    }
    expect(areBillDetailsEqual(bill1, bill2)).toBe(false)

    bill2 = {
      ...bill1,
      amount: {
        amount: 1000n,
        currency: WalletCurrency.UsdCents,
      } as UsdCentsWalletAmount,
    }
    expect(areBillDetailsEqual(bill1, bill2)).toBe(false)
  })
})
