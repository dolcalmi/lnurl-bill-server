import mockKnex from "mock-knex"

import {
  BillPaymentNotFoundRepositoryError,
  BillPaymentNotPersistedRepositoryError,
  BillPaymentNotUpdatedRepositoryError,
  BillPaymentRepositoryError,
  UnknownBillPaymentRepositoryError,
} from "@domain/bill-payment/errors"

import { BillPaymentRepository, queryBuilder } from "@services/database"
import { LnInvoiceStatus, WalletCurrency } from "@domain/shared"

const tracker = mockKnex.getTracker()

beforeEach(() => {
  mockKnex.mock(queryBuilder)
  tracker.install()
})

afterEach(() => {
  tracker.uninstall()
  mockKnex.unmock(queryBuilder)
})

describe("BillPaymentRepository", () => {
  const service = BillPaymentRepository()

  describe("find", () => {
    test("should return BillPayment when found", async () => {
      const billPaymentFindArgs = {
        domain: "some-domain",
        reference: "some-reference",
        period: "some-period",
      } as BillPaymentFindArgs

      const dbBillPaymentRecord = {
        domain: "some-domain",
        reference: "some-reference",
        period: "some-period",
        invoice: "some-invoice",
        invoiceStatus: "PENDING",
        pendingResponse: {
          reference: "some-reference",
          period: "some-period",
          amount: {
            amount: 1234,
            currency: "BTC",
          },
          description: "some-description",
          status: "PENDING",
        },
        paidResponse: {
          reference: "some-reference",
          period: "some-period",
          amount: {
            amount: 1234,
            currency: "BTC",
          },
          description: "some-description",
          status: "PAID",
        },
        notificationSentDate: "2023-04-20T00:00:00.000Z",
      }

      tracker.on("query", (query) => {
        query.response([dbBillPaymentRecord])
      })

      const result = await service.find(billPaymentFindArgs)
      expect(result).not.toBeInstanceOf(Error)
      expect(result).toMatchObject({
        domain: dbBillPaymentRecord.domain,
        reference: dbBillPaymentRecord.reference,
        period: dbBillPaymentRecord.period,
        invoice: dbBillPaymentRecord.invoice,
        invoiceStatus: dbBillPaymentRecord.invoiceStatus,
        pendingResponse: {
          reference: "some-reference",
          period: "some-period",
          amount: {
            amount: 1234n,
            currency: "BTC",
          },
          description: "some-description",
          status: "PENDING",
        },
        paidResponse: {
          reference: "some-reference",
          period: "some-period",
          amount: {
            amount: 1234n,
            currency: "BTC",
          },
          description: "some-description",
          status: "PAID",
        },
        notificationSentDate: new Date(dbBillPaymentRecord.notificationSentDate),
      })
    })

    test("should return BillPaymentNotFoundRepositoryError when not found", async () => {
      const billPaymentFindArgs = {
        domain: "non-existent-domain",
        reference: "non-existent-reference",
        period: "non-existent-period",
      } as BillPaymentFindArgs

      tracker.on("query", (query) => {
        query.response([])
      })

      const result = await service.find(billPaymentFindArgs)
      expect(result).toBeInstanceOf(BillPaymentNotFoundRepositoryError)
    })

    test("should return UnknownBillPaymentRepositoryError on unknown error", async () => {
      const billPaymentFindArgs = {
        domain: "error-domain",
        reference: "error-reference",
        period: "error-period",
      } as BillPaymentFindArgs

      tracker.on("query", (query) => {
        query.reject(new Error("Unknown error"))
      })

      const result = await service.find(billPaymentFindArgs)
      expect(result).toBeInstanceOf(UnknownBillPaymentRepositoryError)
    })
  })

  describe("yieldPending", () => {
    test("should yield pending BillPayments", async () => {
      const billPayments = Array.from({ length: 100 }, (_, i) => {
        const index = i + 1
        const reference = `reference-${index}`
        const period = `period-${index}`
        const invoice = `invoice-${index}`
        const description = `description-${index}`

        return {
          domain: `domain-${index}`,
          reference,
          period,
          invoice,
          invoiceStatus: "PENDING",
          pendingResponse: {
            reference,
            period,
            amount: {
              amount: index * 1000,
              currency: "BTC",
            },
            description,
            status: "PENDING",
          },
        }
      })

      tracker.on("query", (query) => {
        const [, limit, offset] = query.bindings
        query.response(billPayments.slice(offset || 0, (offset || 0) + limit))
      })

      const params = { limit: 10, offset: 0 } as BillPaymentYieldPendingArgs
      const pendingPayments = []
      for await (const pendingPayment of service.yieldPending(params)) {
        pendingPayments.push(pendingPayment)
      }

      expect(pendingPayments).toHaveLength(billPayments.length)
      expect(pendingPayments).toEqual(
        expect.arrayContaining(
          billPayments.map(() =>
            expect.objectContaining({
              domain: expect.any(String),
              reference: expect.any(String),
              period: expect.any(String),
              invoice: expect.any(String),
              invoiceStatus: LnInvoiceStatus.Pending,
              pendingResponse: {
                reference: expect.any(String),
                period: expect.any(String),
                amount: {
                  amount: expect.any(BigInt),
                  currency: WalletCurrency.BtcSats,
                },
                description: expect.any(String),
                status: LnInvoiceStatus.Pending,
              },
            }),
          ),
        ),
      )
    })

    test("should handle empty results", async () => {
      tracker.on("query", (query) => {
        query.response([])
      })

      const params = { limit: 2, offset: 0 } as BillPaymentYieldPendingArgs
      const pendingPayments = []
      for await (const pendingPayment of service.yieldPending(params)) {
        pendingPayments.push(pendingPayment)
      }

      expect(pendingPayments).toHaveLength(0)
    })

    test("should throw BillPaymentRepositoryError on unknown error", async () => {
      tracker.on("query", (query) => {
        query.reject(new Error("Unknown error"))
      })

      const params = { limit: 2, offset: 0 } as BillPaymentYieldPendingArgs
      for await (const pendingPayment of service.yieldPending(params)) {
        expect(pendingPayment).toBeInstanceOf(BillPaymentRepositoryError)
      }
    })
  })

  describe("persistNew", () => {
    const billPayment = {
      domain: "some-domain",
      reference: "some-reference",
      period: "some-period",
      invoice: "some-invoice",
      invoiceStatus: "PENDING",
      pendingResponse: {
        reference: "some-reference",
        period: "some-period",
        amount: {
          amount: 1234n,
          currency: "BTC",
        },
        description: "some-description",
        status: "PENDING",
      },
    } as BillPayment

    test("should return the persisted BillPayment", async () => {
      tracker.on("query", (query) => {
        query.response([{ reference: "some-reference" }])
      })

      const result = await service.persistNew(billPayment)
      expect(result).not.toBeInstanceOf(Error)
      expect(result).toMatchObject(billPayment)
    })

    test("should return BillPaymentNotPersistedRepositoryError when not persisted", async () => {
      tracker.on("query", (query) => {
        query.response([])
      })

      const result = await service.persistNew(billPayment)
      expect(result).toBeInstanceOf(BillPaymentNotPersistedRepositoryError)
    })

    test("should return UnknownBillPaymentRepositoryError on unknown error", async () => {
      tracker.on("query", (query) => {
        query.reject(new Error("Unknown error"))
      })

      const result = await service.persistNew(billPayment)
      expect(result).toBeInstanceOf(UnknownBillPaymentRepositoryError)
    })
  })

  describe("update", () => {
    const billPayment = {
      domain: "some-domain",
      reference: "some-reference",
      period: "some-period",
      invoice: "some-invoice",
      invoiceStatus: "PENDING",
      pendingResponse: {
        reference: "some-reference",
        period: "some-period",
        amount: {
          amount: 1234n,
          currency: "BTC",
        },
        description: "some-description",
        status: "PENDING",
      },
      paidResponse: {
        reference: "some-reference",
        period: "some-period",
        amount: {
          amount: 1234n,
          currency: "BTC",
        },
        description: "some-description",
        status: "PAID",
      },
      notificationSentDate: new Date("2023-04-20T00:00:00.000Z"),
    } as BillPayment

    test("should return the updated BillPayment", async () => {
      tracker.on("query", (query) => {
        query.response([1])
      })

      const result = await service.update(billPayment)
      expect(result).not.toBeInstanceOf(Error)
      expect(result).toMatchObject(billPayment)
    })

    test("should return BillPaymentNotUpdatedRepositoryError when not updated", async () => {
      tracker.on("query", (query) => {
        query.response(0)
      })

      const result = await service.update(billPayment)
      expect(result).toBeInstanceOf(BillPaymentNotUpdatedRepositoryError)
    })

    test("should return UnknownBillPaymentRepositoryError on unknown error", async () => {
      tracker.on("query", (query) => {
        query.reject(new Error("Unknown error"))
      })

      const result = await service.update(billPayment)
      expect(result).toBeInstanceOf(UnknownBillPaymentRepositoryError)
    })
  })
})
