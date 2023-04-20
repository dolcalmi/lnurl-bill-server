import { DomainError, ErrorLevel } from "@domain/shared"

export class BillServiceError extends DomainError {}

export class BillNotFoundError extends BillServiceError {}
export class BillStatusUpdateError extends BillServiceError {}
export class InvalidBillError extends BillServiceError {
  level = ErrorLevel.Critical
}

export class BillIssuerTomlError extends BillServiceError {
  level = ErrorLevel.Critical
}
export class UnknownBillServiceError extends BillServiceError {
  level = ErrorLevel.Critical
}
