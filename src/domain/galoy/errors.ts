import { DomainError, ErrorLevel } from "@domain/shared"

export class GaloyServiceError extends DomainError {}

export class UnknownGaloyServiceError extends GaloyServiceError {
  level = ErrorLevel.Critical
}
