import { DomainError, ErrorLevel } from "@domain/shared"

export class GaloyServiceError extends DomainError {}

export class InvalidUsernameError extends GaloyServiceError {}
export class InvoiceRequestError extends GaloyServiceError {}
export class UnknownGaloyServiceError extends GaloyServiceError {
  level = ErrorLevel.Critical
}
