/**
 * アプリケーション共通エラークラス
 *
 * 参照: docs/implementation-strategy.md Phase 2.4
 *
 * セキュリティ注意:
 * - isOperational: true のエラーはユーザーに表示可能
 * - isOperational: false のエラーはログのみに記録し、汎用メッセージを表示
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;

  constructor(
    statusCode: number,
    message: string,
    isOperational: boolean = true
  ) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();

    // TypeScript での正しい継承のための設定
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found エラー
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`, true);
  }
}

/**
 * 401 Unauthorized エラー
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, message, true);
  }
}

/**
 * 403 Forbidden エラー
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, message, true);
  }
}

/**
 * 400 Bad Request エラー
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(400, message, true);
  }
}

/**
 * 409 Conflict エラー
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(409, message, true);
  }
}

/**
 * バリデーションエラー (422 Unprocessable Entity)
 */
export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>) {
    super(422, 'Validation failed', true);
    this.errors = errors;
  }
}
