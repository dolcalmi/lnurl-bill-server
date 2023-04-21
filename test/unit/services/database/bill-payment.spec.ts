import mockKnex from "mock-knex"

import {
  BillPaymentNotFoundRepositoryError,
  BillPaymentNotPersistedRepositoryError,
  BillPaymentNotUpdatedRepositoryError,
  UnknownBillPaymentRepositoryError,
} from "@domain/bill-payment/errors"

import { BillPaymentRepository, queryBuilder } from "@services/database"

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
    it("should return BillPayment when found", async () => {
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
          amount: 1234,
          currency: "BTC",
          description: "some-description",
          status: "PENDING",
        },
        paidResponse: {
          reference: "some-reference",
          period: "some-period",
          amount: 1234,
          currency: "BTC",
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

    it("should return BillPaymentNotFoundRepositoryError when not found", async () => {
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

    it("should return UnknownBillPaymentRepositoryError on unknown error", async () => {
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

    it("should return the persisted BillPayment", async () => {
      tracker.on("query", (query) => {
        query.response([1])
      })

      const result = await service.persistNew(billPayment)
      expect(result).not.toBeInstanceOf(Error)
      expect(result).toMatchObject(billPayment)
    })

    it("should return BillPaymentNotPersistedRepositoryError when not persisted", async () => {
      tracker.on("query", (query) => {
        query.response([0])
      })

      const result = await service.persistNew(billPayment)
      expect(result).toBeInstanceOf(BillPaymentNotPersistedRepositoryError)
    })

    it("should return UnknownBillPaymentRepositoryError on unknown error", async () => {
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

    it("should return the updated BillPayment", async () => {
      tracker.on("query", (query) => {
        query.response([1])
      })

      const result = await service.update(billPayment)
      expect(result).not.toBeInstanceOf(Error)
      expect(result).toMatchObject(billPayment)
    })

    it("should return BillPaymentNotUpdatedRepositoryError when not updated", async () => {
      tracker.on("query", (query) => {
        query.response(0)
      })

      const result = await service.update(billPayment)
      expect(result).toBeInstanceOf(BillPaymentNotUpdatedRepositoryError)
    })

    it("should return UnknownBillPaymentRepositoryError on unknown error", async () => {
      tracker.on("query", (query) => {
        query.reject(new Error("Unknown error"))
      })

      const result = await service.update(billPayment)
      expect(result).toBeInstanceOf(UnknownBillPaymentRepositoryError)
    })
  })
})
