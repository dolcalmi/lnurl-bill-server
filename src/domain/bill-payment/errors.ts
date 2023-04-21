import { ErrorLevel, RepositoryError } from "@domain/shared"

export class BillPaymentRepositoryError extends RepositoryError {}

export class BillPaymentNotFoundRepositoryError extends BillPaymentRepositoryError {}
export class BillPaymentNotPersistedRepositoryError extends BillPaymentRepositoryError {
  level = ErrorLevel.Critical
}
export class BillPaymentNotUpdatedRepositoryError extends BillPaymentRepositoryError {
  level = ErrorLevel.Critical
}
export class UnknownBillPaymentRepositoryError extends BillPaymentRepositoryError {
  level = ErrorLevel.Critical
}
