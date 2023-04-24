import { updatePayment } from "@app/bill/update-payments"

import { BillPaymentStatus } from "@domain/bill"
import { LnInvoiceStatus, WalletCurrency } from "@domain/shared"
import {
  BillAlreadyPaidError,
  BillExpiredError,
  BillNoUpdateNeededError,
} from "@domain/bill/errors"

import * as BillServiceImpl from "@services/bill"
import * as GaloyServiceImpl from "@services/galoy"
import * as BillPaymentRepositoryImpl from "@services/database/bill-payment"

describe("updatePayment", () => {
  const bill = {
    reference: "reference-1" as BillRef,
    period: "period-1" as BillPeriod,
    amount: {
      amount: 1000n,
      currency: WalletCurrency.BtcSats,
    } as BtcSatsWalletAmount,
    description: "description-1",
    status: BillPaymentStatus.Pending,
  } as Bill

  const billPayment = {
    domain: "domain-1" as Domain,
    reference: "reference-1" as BillRef,
    period: "period-1" as BillPeriod,
    invoice: "invoice-1" as LnInvoice,
    invoiceStatus: LnInvoiceStatus.Pending,
    pendingResponse: bill,
  } as BillPayment

  test("should return BillExpiredError when invoice status is expired", async () => {
    const testBillPayment = { ...billPayment, invoiceStatus: LnInvoiceStatus.Expired }
    const result = await updatePayment(testBillPayment)
    expect(result).toBeInstanceOf(BillExpiredError)
  })

  test("should return BillAlreadyPaidError when invoice status is paid", async () => {
    const testBillPayment = { ...billPayment, invoiceStatus: LnInvoiceStatus.Paid }
    const result = await updatePayment(testBillPayment)
    expect(result).toBeInstanceOf(BillAlreadyPaidError)
  })

  test("should return BillNoUpdateNeededError when invoice status is pending", async () => {
    jest.spyOn(GaloyServiceImpl, "GaloyService").mockImplementationOnce(() => ({
      checkInvoiceStatus: () => Promise.resolve(LnInvoiceStatus.Pending),
      createInvoice: jest.fn(),
    }))

    const result = await updatePayment(billPayment)
    expect(result).toBeInstanceOf(BillNoUpdateNeededError)
  })

  test("should update and return true when invoice status changes to expired", async () => {
    jest.spyOn(GaloyServiceImpl, "GaloyService").mockImplementationOnce(() => ({
      checkInvoiceStatus: () => Promise.resolve(LnInvoiceStatus.Expired),
      createInvoice: jest.fn(),
    }))

    const updateFunc = jest.fn()
    jest
      .spyOn(BillPaymentRepositoryImpl, "BillPaymentRepository")
      .mockImplementationOnce(() => ({
        find: jest.fn(),
        persistNew: jest.fn(),
        update: updateFunc,
        yieldPending: jest.fn(),
      }))

    const result = await updatePayment(billPayment)
    expect(result).toBe(true)

    expect(updateFunc).toHaveBeenCalledTimes(1)
    expect(updateFunc).toHaveBeenCalledWith({
      ...billPayment,
      invoiceStatus: LnInvoiceStatus.Expired,
      paidResponse: undefined,
      notificationSentDate: undefined,
    })
  })

  test("should update and return true when invoice status changes to paid", async () => {
    jest.spyOn(GaloyServiceImpl, "GaloyService").mockImplementationOnce(() => ({
      checkInvoiceStatus: () => Promise.resolve(LnInvoiceStatus.Paid),
      createInvoice: jest.fn(),
    }))

    const paidBill = { ...bill, status: LnInvoiceStatus.Paid }
    jest.spyOn(BillServiceImpl, "BillService").mockImplementationOnce(() => ({
      lookupByRef: jest.fn(),
      resolveSettings: jest.fn(),
      notifyPaymentReceived: () => Promise.resolve(paidBill),
    }))

    const updateFunc = jest.fn()
    jest
      .spyOn(BillPaymentRepositoryImpl, "BillPaymentRepository")
      .mockImplementationOnce(() => ({
        find: jest.fn(),
        persistNew: jest.fn(),
        update: updateFunc,
        yieldPending: jest.fn(),
      }))

    const result = await updatePayment(billPayment)
    expect(result).toBe(true)

    expect(updateFunc).toHaveBeenCalledTimes(1)
    expect(updateFunc).toHaveBeenCalledWith({
      ...billPayment,
      invoiceStatus: LnInvoiceStatus.Paid,
      paidResponse: paidBill,
      notificationSentDate: expect.any(Date),
    })
  })
})
