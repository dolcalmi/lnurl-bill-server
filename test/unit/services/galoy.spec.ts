import { request } from "graphql-request"

import {
  InvalidUsernameError,
  InvoiceRequestError,
  UnknownGaloyServiceError,
} from "@domain/galoy/errors"
import { GaloyWalletCurrency } from "@domain/galoy"

import { GaloyService } from "@services/galoy"

jest.mock("graphql-request")

const mockedRequest = request as jest.MockedFunction<typeof request>

describe("createInvoice", () => {
  const service = GaloyService()
  const username = "testuser" as GaloyUsername
  const amount = { currency: GaloyWalletCurrency.Btc, amount: 1000n }
  const usdAmount = { currency: GaloyWalletCurrency.Usd, amount: 1000n }
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

  test("should throw InvalidUsernameError when wallet not found", async () => {
    const walletResponse: WalletQueryResponse = {}

    mockedRequest.mockResolvedValueOnce(walletResponse)

    const result = await service.createInvoice({ username, amount, memo })
    expect(result).toBeInstanceOf(InvalidUsernameError)
    expect(mockedRequest).toHaveBeenCalledTimes(1)
  })

  test("should throw InvoiceRequestError when invoice request has errors", async () => {
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

  test("should throw UnknownGaloyServiceError when invoice is not present", async () => {
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

  test("should throw UnknownGaloyServiceError when an error occurs", async () => {
    const errorMessage = "Request failed"

    mockedRequest.mockRejectedValueOnce(new Error(errorMessage))

    const result = await service.createInvoice({ username, amount, memo })
    if (!(result instanceof Error)) throw Error("Invalid data")

    expect(result).toBeInstanceOf(UnknownGaloyServiceError)
    expect(result.message).toBe(errorMessage)
    expect(mockedRequest).toHaveBeenCalledTimes(1)
  })
})
