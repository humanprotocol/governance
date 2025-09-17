export class BaseError extends Error {
  constructor(message: string, stack?: string) {
    super(message);
    this.name = this.constructor.name;
    if (stack) {
      this.stack = stack;
    }
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string, stack?: string) {
    super(message, stack);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, stack?: string) {
    super(message, stack);
  }
}

export class ServerError extends BaseError {
  constructor(message: string, stack?: string) {
    super(message, stack);
  }
}
