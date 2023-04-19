import { request } from "graphql-request"

import {
  InvalidInvoiceError,
  InvalidUsernameError,
  InvoiceRequestError,
  UnknownGaloyServiceError,
} from "@domain/galoy/errors"
import { WalletCurrency } from "@domain/shared"
import { GaloyInvoiceStatus } from "@domain/galoy"

import { GaloyService } from "@services/galoy"

jest.mock("graphql-request")

const mockedRequest = request as jest.MockedFunction<typeof request>

describe("createInvoice", () => {
  const service = GaloyService()
  const username = "testuser" as GaloyUsername
  const amount = { currency: WalletCurrency.BtcSats, amount: 1000n }
  const usdAmount = { currency: WalletCurrency.UsdCents, amount: 1000n }
  const memo = "Test memo" as GaloyMemo

  afterEach(() => {
    mockedRequest.mockClear()
  })

  test("should create a valid BTC invoice", async () => {
    const walletResponse: WalletQueryResponse = {
      wallet: { id: "wallet_id", walletCurrency: "BTC" },
    }
    const invoiceResponse: CreateInvoiceMutationResponse = {
      lnInvoice: {
        errors: [],
        invoice: { paymentRequest: "lninvoice" as LnInvoice },
      },
    }

    mockedRequest
      .mockResolvedValueOnce(walletResponse)
      .mockResolvedValueOnce(invoiceResponse)

    const result = await service.createInvoice({ username, amount, memo })
    expect(result).toBe("lninvoice")
    expect(mockedRequest).toHaveBeenCalledTimes(2)
  })

  test("should create a valid USD invoice", async () => {
    const walletResponse: WalletQueryResponse = {
      wallet: { id: "wallet_id", walletCurrency: "USD" },
    }
    const invoiceResponse: CreateInvoiceMutationResponse = {
      lnInvoice: {
        errors: [],
        invoice: { paymentRequest: "lnUsdinvoice" as LnInvoice },
      },
    }

    mockedRequest
      .mockResolvedValueOnce(walletResponse)
      .mockResolvedValueOnce(invoiceResponse)

    const result = await service.createInvoice({ username, amount: usdAmount, memo })
    expect(result).toBe("lnUsdinvoice")
    expect(mockedRequest).toHaveBeenCalledTimes(2)
  })

  test("should return InvalidUsernameError when wallet not found", async () => {
    const walletResponse: WalletQueryResponse = {}

    mockedRequest.mockResolvedValueOnce(walletResponse)

    const result = await service.createInvoice({ username, amount, memo })
    expect(result).toBeInstanceOf(InvalidUsernameError)
    expect(mockedRequest).toHaveBeenCalledTimes(1)
  })

  test("should return InvoiceRequestError when invoice request has errors", async () => {
    const walletResponse: WalletQueryResponse = {
      wallet: { id: "wallet_id", walletCurrency: "BTC" },
    }
    const invoiceResponse: CreateInvoiceMutationResponse = {
      lnInvoice: {
        errors: [{ message: "Error creating invoice" }],
      },
    }

    mockedRequest
      .mockResolvedValueOnce(walletResponse)
      .mockResolvedValueOnce(invoiceResponse)

    const result = await service.createInvoice({ username, amount, memo })
    expect(result).toBeInstanceOf(InvoiceRequestError)
    expect(mockedRequest).toHaveBeenCalledTimes(2)
  })

  test("should return UnknownGaloyServiceError when invoice is not present", async () => {
    const walletResponse: WalletQueryResponse = {
      wallet: { id: "wallet_id", walletCurrency: "BTC" },
    }
    const invoiceResponse: CreateInvoiceMutationResponse = {
      lnInvoice: {},
    }

    mockedRequest
      .mockResolvedValueOnce(walletResponse)
      .mockResolvedValueOnce(invoiceResponse)

    const result = await service.createInvoice({ username, amount, memo })
    expect(result).toBeInstanceOf(UnknownGaloyServiceError)
    expect(mockedRequest).toHaveBeenCalledTimes(2)
  })

  test("should return InvalidUsernameError when an invalid username is used", async () => {
    mockedRequest.mockRejectedValueOnce({
      response: {
        errors: [
          {
            message: "Account does not exist for username testing1",
            locations: [{ line: 3, column: 5 }],
            path: ["wallet"],
            code: "NOT_FOUND",
          },
        ],
        data: null,
        status: 200,
        headers: {},
      },
    })

    const result = await service.createInvoice({ username, amount, memo })
    if (!(result instanceof Error)) throw Error("Invalid data")

    expect(result).toBeInstanceOf(InvalidUsernameError)
    expect(mockedRequest).toHaveBeenCalledTimes(1)
  })

  test("should return UnknownGaloyServiceError when an error occurs", async () => {
    const errorMessage = "Request failed"

    mockedRequest.mockRejectedValueOnce(new Error(errorMessage))

    const result = await service.createInvoice({ username, amount, memo })
    if (!(result instanceof Error)) throw Error("Invalid data")

    expect(result).toBeInstanceOf(UnknownGaloyServiceError)
    expect(result.message).toBe(errorMessage)
    expect(mockedRequest).toHaveBeenCalledTimes(1)
  })
})

describe("checkInvoiceStatus", () => {
  const service = GaloyService()
  const invoice =
    "lntbs334330n1pjregulpp5jzp3c99kq5t56h8alh5sac7f7xwssqhpvz7z2059qjtuxpm9lwdsdqqcqzpuxqzfvsp5su6plkyed3lckhlnpgf97gudalv5w7mv0x0dsxr4z4ngdvhtltps9qyyssqaj9cq67xl6e6qp3laf5jmddpcgdq3cwssguk3sckru02xplhe7lr9j9c2hf4c50ytnpgk9hnkl9gawzcm5atjeusgu24z5x7gmrf8tgptd073t" as LnInvoice

  afterEach(() => {
    mockedRequest.mockClear()
  })

  test("should return paid status", async () => {
    const invoiceStatusResponse: InvoiceStatusQueryResponse = {
      lnInvoice: { status: "PAID" },
    }

    mockedRequest.mockResolvedValueOnce(invoiceStatusResponse)

    const result = await service.checkInvoiceStatus({ invoice })
    if (result instanceof Error) throw Error("Invalid data")

    expect(result).toBe(GaloyInvoiceStatus.Paid)
    expect(mockedRequest).toHaveBeenCalledTimes(1)
  })

  test("should return pending status", async () => {
    const invoiceStatusResponse: InvoiceStatusQueryResponse = {
      lnInvoice: { status: "PENDING" },
    }

    mockedRequest.mockResolvedValueOnce(invoiceStatusResponse)

    const result = await service.checkInvoiceStatus({ invoice })
    if (result instanceof Error) throw Error("Invalid data")

    expect(result).toBe(GaloyInvoiceStatus.Pending)
    expect(mockedRequest).toHaveBeenCalledTimes(1)
  })

  test("should return expired status", async () => {
    const invoiceStatusResponse: InvoiceStatusQueryResponse = {
      lnInvoice: { status: "EXPIRED" },
    }

    mockedRequest.mockResolvedValueOnce(invoiceStatusResponse)

    const result = await service.checkInvoiceStatus({ invoice })
    if (result instanceof Error) throw Error("Invalid data")

    expect(result).toBe(GaloyInvoiceStatus.Expired)
    expect(mockedRequest).toHaveBeenCalledTimes(1)
  })

  test("should return InvalidInvoiceError when an invalid invoice is used", async () => {
    mockedRequest.mockRejectedValueOnce({
      response: {
        errors: [
          {
            message: "Invalid value for LnPaymentRequest",
            locations: [{ line: 3, column: 5 }],
            path: ["lnInvoice"],
            code: "INVALID_INPUT",
          },
        ],
        data: null,
        status: 200,
        headers: {},
      },
    })

    const result = await service.checkInvoiceStatus({ invoice })
    if (!(result instanceof Error)) throw Error("Invalid data")

    expect(result).toBeInstanceOf(InvalidInvoiceError)
    expect(mockedRequest).toHaveBeenCalledTimes(1)
  })
})
