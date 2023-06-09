export const ErrorLevel = {
  Info: "info",
  Warn: "warn",
  Critical: "critical",
} as const

export const RankedErrorLevel = [ErrorLevel.Info, ErrorLevel.Warn, ErrorLevel.Critical]

export class DomainError extends Error {
  name: string
  level?: ErrorLevel
  constructor(message?: string) {
    super(message)
    this.name = this.constructor.name
    this.level = ErrorLevel.Info
  }
}

export class ValidationError extends DomainError {}
export class InvalidInvoiceAmountError extends ValidationError {}
export class InvalidLnInvoiceStatusError extends ValidationError {}

export class JobError extends DomainError {}
export class RepositoryError extends DomainError {}
export class DbConnectionError extends RepositoryError {
  level = ErrorLevel.Critical
}
