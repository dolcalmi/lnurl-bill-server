import { createPayment } from "@app/bill/create-payment"
import { BillAlreadyPaidError } from "@domain/bill/errors"
import { LnInvoiceStatus, WalletCurrency } from "@domain/shared"
import * as BillServiceImpl from "@services/bill"
import * as GaloyServiceImpl from "@services/galoy"
import * as BillPaymentRepositoryImpl from "@services/database/bill-payment"
import { BillPaymentNotFoundRepositoryError } from "@domain/bill-payment/errors"

describe("createPayment", () => {
  const domain = "domain-1" as Domain
  const reference = "reference-1" as BillRef
  const descriptionHash = "description-hash" as GaloyDescriptionHash
  const memo = "memo-1" as GaloyMemo

  const billIssuer = {
    domain,
    name: "Example Organization",
    username: "username-1",
    billServerUrl: "https://blink.example.org/api",
    pubkey: "EXAMPLEPUBLICKEY",
    logoUrl: "https://example.org/logo.png",
  } as BillIssuer

  const bill = {
    reference,
    period: "period-1" as BillPeriod,
    amount: {
      amount: 1000n,
      currency: WalletCurrency.BtcSats,
    } as BtcSatsWalletAmount,
    description: "description-1",
    status: LnInvoiceStatus.Pending,
  } as Bill

  const billPayment = {
    domain,
    reference,
    period: "period-1" as BillPeriod,
    invoice: "invoice-1" as LnInvoice,
    invoiceStatus: LnInvoiceStatus.Pending,
    pendingResponse: bill,
  } as BillPayment

  test("should return BillAlreadyPaidError when invoice status is paid", async () => {
    jest.spyOn(BillServiceImpl, "BillService").mockImplementationOnce(() => ({
      lookupByRef: () => Promise.resolve(bill),
      notifyPaymentReceived: jest.fn(),
      resolveSettings: jest.fn(),
    }))
    jest
      .spyOn(BillPaymentRepositoryImpl, "BillPaymentRepository")
      .mockImplementationOnce(() => ({
        find: () =>
          Promise.resolve({ ...billPayment, invoiceStatus: LnInvoiceStatus.Paid }),
        persistNew: jest.fn(),
        update: jest.fn(),
        yieldPending: jest.fn(),
      }))

    const result = await createPayment({ domain, reference, descriptionHash, memo })
    expect(result).toBeInstanceOf(BillAlreadyPaidError)
  })

  test("should return a BillAlreadyPaidError when billPayment still pending and galoy status is paid", async () => {
    jest.spyOn(BillServiceImpl, "BillService").mockImplementationOnce(() => ({
      lookupByRef: () => Promise.resolve(bill),
      notifyPaymentReceived: jest.fn(),
      resolveSettings: jest.fn(),
    }))
    jest
      .spyOn(BillPaymentRepositoryImpl, "BillPaymentRepository")
      .mockImplementationOnce(() => ({
        find: () => Promise.resolve(billPayment),
        persistNew: jest.fn(),
        update: jest.fn(),
        yieldPending: jest.fn(),
      }))
    jest.spyOn(GaloyServiceImpl, "GaloyService").mockImplementationOnce(() => ({
      checkInvoiceStatus: () => Promise.resolve(LnInvoiceStatus.Paid),
      createInvoice: jest.fn(),
    }))

    const result = await createPayment({ domain, reference, descriptionHash, memo })
    expect(result).toBeInstanceOf(BillAlreadyPaidError)
  })

  test("should return a BillPayment when invoice status is pending", async () => {
    jest.spyOn(BillServiceImpl, "BillService").mockImplementationOnce(() => ({
      lookupByRef: () => Promise.resolve(bill),
      notifyPaymentReceived: jest.fn(),
      resolveSettings: jest.fn(),
    }))
    jest
      .spyOn(BillPaymentRepositoryImpl, "BillPaymentRepository")
      .mockImplementationOnce(() => ({
        find: () => Promise.resolve(billPayment),
        persistNew: jest.fn(),
        update: jest.fn(),
        yieldPending: jest.fn(),
      }))
    jest.spyOn(GaloyServiceImpl, "GaloyService").mockImplementationOnce(() => ({
      checkInvoiceStatus: () => Promise.resolve(LnInvoiceStatus.Pending),
      createInvoice: jest.fn(),
    }))

    const result = await createPayment({ domain, reference, descriptionHash, memo })
    expect(result).toEqual(billPayment)
  })

  test("should persist and return a new BillPayment if not found", async () => {
    jest.spyOn(BillServiceImpl, "BillService").mockImplementationOnce(() => ({
      lookupByRef: () => Promise.resolve(bill),
      resolveSettings: () => Promise.resolve(billIssuer),
      notifyPaymentReceived: jest.fn(),
    }))
    jest
      .spyOn(BillPaymentRepositoryImpl, "BillPaymentRepository")
      .mockImplementationOnce(() => ({
        find: () =>
          Promise.resolve(
            new BillPaymentNotFoundRepositoryError("BillPayment not found"),
          ),
        persistNew: (newBillPayment: BillPayment) => Promise.resolve(newBillPayment),
        update: jest.fn(),
        yieldPending: jest.fn(),
      }))
    jest.spyOn(GaloyServiceImpl, "GaloyService").mockImplementationOnce(() => ({
      createInvoice: () => Promise.resolve("invoice-2" as LnInvoice),
      checkInvoiceStatus: jest.fn(),
    }))

    const result = await createPayment({ domain, reference, descriptionHash, memo })
    expect(result).toEqual({
      domain,
      reference,
      period: bill.period,
      invoice: "invoice-2" as LnInvoice,
      invoiceStatus: LnInvoiceStatus.Pending,
      pendingResponse: bill,
    })
  })

  test("should update the existing BillPayment and return it when invoice has expired", async () => {
    jest.spyOn(BillServiceImpl, "BillService").mockImplementationOnce(() => ({
      lookupByRef: () => Promise.resolve(bill),
      resolveSettings: () => Promise.resolve(billIssuer),
      notifyPaymentReceived: jest.fn(),
    }))
    jest
      .spyOn(BillPaymentRepositoryImpl, "BillPaymentRepository")
      .mockImplementationOnce(() => ({
        find: () => Promise.resolve(billPayment),
        update: (updatedBillPayment: BillPayment) => Promise.resolve(updatedBillPayment),
        persistNew: jest.fn(),
        yieldPending: jest.fn(),
      }))
    jest.spyOn(GaloyServiceImpl, "GaloyService").mockImplementationOnce(() => ({
      checkInvoiceStatus: () => Promise.resolve(LnInvoiceStatus.Expired),
      createInvoice: () => Promise.resolve("invoice-2" as LnInvoice),
    }))

    const result = await createPayment({ domain, reference, descriptionHash, memo })
    expect(result).toEqual({
      ...billPayment,
      invoice: "invoice-2" as LnInvoice,
      invoiceStatus: LnInvoiceStatus.Pending,
      pendingResponse: bill,
    })
  })
})
