import axios from "axios"

import {
  BillIssuerTomlError,
  BillNotFoundError,
  BillStatusUpdateError,
  InvalidBillError,
  UnknownBillServiceError,
} from "@domain/bill/errors"
import { BillPaymentStatus } from "@domain/bill"

import { BillService } from "@services/bill"

jest.mock("axios")

const MOCK_TOML_DATA = `
  AUTH_PUBLIC_KEY = "EXAMPLEPUBLICKEY"
  ORG_NAME = "Example Organization"
  ORG_LOGO_URL = "https://example.org/logo.png"
`

const mockTomlAxiosGet = (data = MOCK_TOML_DATA) => {
  jest.spyOn(axios, "get").mockImplementation(() =>
    Promise.resolve({
      data,
    }),
  )
}

const mockBillAxiosGet = (data: object, status = 200) => {
  jest.spyOn(axios, "get").mockImplementation((url) => {
    if (url.includes("blink.toml")) {
      return Promise.resolve({ data: MOCK_TOML_DATA, status: 200 })
    }
    return Promise.resolve({ data, status })
  })
}

const mockBillAxiosPut = (data = {}, status = 200) => {
  mockTomlAxiosGet()
  jest.spyOn(axios, "put").mockImplementation(() =>
    Promise.resolve({
      status,
      data,
    }),
  )
}

describe("BillService", () => {
  const service = BillService()
  const domain = "example.org" as Domain
  const reference = "valid-ref" as BillRef

  beforeEach(() => {
    jest.restoreAllMocks()
  })

  describe("resolveSettings", () => {
    test("should return a BillIssuer object on successful TOML file fetch", async () => {
      mockTomlAxiosGet()
      const result = await service.resolveSettings({
        domain,
        allowHttp: false,
        timeoutMs: 30000,
      })

      expect(result).toEqual({
        domain,
        name: "Example Organization",
        billServerUrl: "https://blink.example.org/api",
        pubkey: "EXAMPLEPUBLICKEY",
        logoUrl: "https://example.org/logo.png",
      })
    })

    test("should throw a BillIssuerTomlError if required settings are missing", async () => {
      mockTomlAxiosGet(
        "AUTH_PUBLIC_KEY = 'EXAMPLEPUBLICKEY'\nORG_LOGO_URL = 'https://example.org/logo.png'",
      )
      const result = await service.resolveSettings({
        domain,
        allowHttp: false,
        timeoutMs: 30000,
      })
      expect(result).toBeInstanceOf(BillIssuerTomlError)
    })

    test("should throw an UnknownBillServiceError for unknown errors", async () => {
      jest.spyOn(axios, "get").mockRejectedValue(new Error("An unknown error occurred"))

      const result = await service.resolveSettings({
        domain,
        allowHttp: false,
        timeoutMs: 30000,
      })
      expect(result).toBeInstanceOf(UnknownBillServiceError)
    })

    test("should use HTTPS by default", async () => {
      mockTomlAxiosGet()
      await service.resolveSettings({ domain })

      expect(axios.get).toHaveBeenCalledWith(
        "https://blink.example.org/.well-known/blink.toml",
        expect.objectContaining({
          signal: expect.any(AbortSignal),
          timeout: 30000,
          maxContentLength: 100 * 1024,
        }),
      )
    })

    test("should use HTTP when allowHttp is set to true", async () => {
      mockTomlAxiosGet()
      await service.resolveSettings({ domain, allowHttp: true })

      expect(axios.get).toHaveBeenCalledWith(
        "http://blink.example.org/.well-known/blink.toml",
        expect.objectContaining({
          signal: expect.any(AbortSignal),
          timeout: 30000,
          maxContentLength: 100 * 1024,
        }),
      )
    })
  })

  describe("lookupByRef", () => {
    test("should return a bill for a valid reference", async () => {
      mockBillAxiosGet({
        reference: "valid-ref",
        period: "Apr2023",
        amount: 1000,
        currency: "USD",
        description: "Test Bill",
        status: "PENDING",
      })
      const result = await service.lookupByRef({ domain, reference })
      if (result instanceof Error) throw result

      expect(result).toEqual({
        reference: "valid-ref",
        period: "Apr2023",
        amount: {
          amount: 1000,
          currency: "USD",
        },
        description: "Test Bill",
        status: BillPaymentStatus.Pending,
      })
    })

    test("should return BillNotFoundError for a non-existent reference", async () => {
      mockBillAxiosGet({}, 404)
      const result = await service.lookupByRef({ domain, reference })
      expect(result).toBeInstanceOf(BillNotFoundError)
      expect(result).toHaveProperty("message", "Bill not found")
      expect(axios.get).toHaveBeenCalledTimes(2)
      expect(axios.get).toHaveBeenNthCalledWith(
        2,
        "https://blink.example.org/api/bills/valid-ref",
      )
    })

    test("should return UnknownBillServiceError for a server error", async () => {
      mockBillAxiosGet({}, 500)
      const result = await service.lookupByRef({ domain, reference })
      expect(result).toBeInstanceOf(UnknownBillServiceError)
      expect(result).toHaveProperty("message", "Invalid data")
      expect(axios.get).toHaveBeenCalledTimes(2)
      expect(axios.get).toHaveBeenNthCalledWith(
        2,
        "https://blink.example.org/api/bills/valid-ref",
      )
    })

    test("should return InvalidBillError for invalid bill amount", async () => {
      mockBillAxiosGet({
        reference: "valid-ref",
        period: "Apr2023",
        amount: -100,
        currency: "USD",
        description: "Invalid Test Bill",
        status: "PENDING",
      })
      const result = await service.lookupByRef({
        domain,
        reference: "valid-ref" as BillRef,
      })
      expect(result).toBeInstanceOf(InvalidBillError)
      expect(result).toHaveProperty("message", "Invalid amount")
      expect(axios.get).toHaveBeenCalledTimes(2)
      expect(axios.get).toHaveBeenNthCalledWith(
        2,
        "https://blink.example.org/api/bills/valid-ref",
      )
    })

    test("should return InvalidBillError for invalid bill status", async () => {
      mockBillAxiosGet({
        reference: "valid-ref",
        period: "Apr2023",
        amount: 100,
        currency: "USD",
        description: "Invalid Test Bill",
        status: "INVALID_STATUS",
      })
      const result = await service.lookupByRef({
        domain,
        reference: "valid-ref" as BillRef,
      })
      expect(result).toBeInstanceOf(InvalidBillError)
      expect(result).toHaveProperty("message", "Invalid status")
      expect(axios.get).toHaveBeenCalledTimes(2)
      expect(axios.get).toHaveBeenNthCalledWith(
        2,
        "https://blink.example.org/api/bills/valid-ref",
      )
    })

    test("should return InvalidBillError for invalid bill period", async () => {
      mockBillAxiosGet({
        reference: "valid-ref",
        period: "",
        amount: 100,
        currency: "USD",
        description: "Invalid Test Bill",
        status: "PENDING",
      })
      const result = await service.lookupByRef({
        domain,
        reference: "valid-ref" as BillRef,
      })
      expect(result).toBeInstanceOf(InvalidBillError)
      expect(result).toHaveProperty("message", "Invalid period")
      expect(axios.get).toHaveBeenCalledTimes(2)
      expect(axios.get).toHaveBeenNthCalledWith(
        2,
        "https://blink.example.org/api/bills/valid-ref",
      )
    })

    test("should return InvalidBillError for invalid bill reference", async () => {
      mockBillAxiosGet({
        reference: "invalid-ref",
        period: "Apr2023",
        amount: 100,
        currency: "USD",
        description: "Invalid Test Bill",
        status: "PENDING",
      })
      const result = await service.lookupByRef({ domain, reference })
      expect(result).toBeInstanceOf(InvalidBillError)
      expect(result).toHaveProperty("message", "Invalid reference")
      expect(axios.get).toHaveBeenCalledTimes(2)
      expect(axios.get).toHaveBeenNthCalledWith(
        2,
        "https://blink.example.org/api/bills/valid-ref",
      )
    })
  })

  describe("notifyPaymentReceived", () => {
    test("should return true when notification was sent successfully", async () => {
      mockBillAxiosPut({
        reference: "valid-ref",
        period: "Apr2023",
        amount: 1000,
        currency: "USD",
        description: "Test Bill",
        status: "PAID",
      })
      const result = await service.notifyPaymentReceived({ domain, reference })
      if (result instanceof Error) throw result

      expect(result).toBe(true)
    })

    test("should return BillNotFoundError for a non-existent reference", async () => {
      mockBillAxiosPut({}, 404)
      const result = await service.notifyPaymentReceived({ domain, reference })
      expect(result).toBeInstanceOf(BillNotFoundError)
      expect(result).toHaveProperty("message", "Bill not found")
      expect(axios.put).toHaveBeenCalledTimes(1)
      expect(axios.put).toHaveBeenCalledWith("https://blink.example.org/api/bills/", {
        reference: "valid-ref",
        status: BillPaymentStatus.Paid,
      })
    })

    test("should return UnknownBillServiceError for a server error", async () => {
      mockBillAxiosPut({}, 500)
      const result = await service.notifyPaymentReceived({ domain, reference })
      expect(result).toBeInstanceOf(UnknownBillServiceError)
      expect(result).toHaveProperty("message", "Invalid data")
      expect(axios.put).toHaveBeenCalledTimes(1)
      expect(axios.put).toHaveBeenCalledWith("https://blink.example.org/api/bills/", {
        reference: "valid-ref",
        status: BillPaymentStatus.Paid,
      })
    })

    test("should return InvalidBillError for invalid bill reference", async () => {
      mockBillAxiosPut({
        reference: "invalid-ref",
        period: "Apr2023",
        amount: 1000,
        currency: "USD",
        description: "Test Bill",
        status: "PAID",
      })
      const result = await service.notifyPaymentReceived({ domain, reference })
      expect(result).toBeInstanceOf(InvalidBillError)
      expect(result).toHaveProperty("message", "Invalid reference")
      expect(axios.put).toHaveBeenCalledTimes(1)
      expect(axios.put).toHaveBeenCalledWith("https://blink.example.org/api/bills/", {
        reference: "valid-ref",
        status: BillPaymentStatus.Paid,
      })
    })

    test("should return BillStatusUpdateError for not updated bill status", async () => {
      mockBillAxiosPut({
        reference: "valid-ref",
        period: "Apr2023",
        amount: 1000,
        currency: "USD",
        description: "Test Bill",
        status: "PENDING",
      })
      const result = await service.notifyPaymentReceived({ domain, reference })
      expect(result).toBeInstanceOf(BillStatusUpdateError)
      expect(result).toHaveProperty("message", "Status was not updated")
      expect(axios.put).toHaveBeenCalledTimes(1)
      expect(axios.put).toHaveBeenCalledWith("https://blink.example.org/api/bills/", {
        reference: "valid-ref",
        status: BillPaymentStatus.Paid,
      })
    })
  })
})
