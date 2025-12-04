/**
 * Centralized Error Response Utilities
 *
 * Provides consistent error response formatting across the application
 */

import { ZodError } from "zod";

export interface ErrorResponse {
  error: string;
  details?: string;
  code?: string;
}

export interface SuccessResponse<T = any> {
  success: true;
  message?: string;
  data?: T;
}

export type ActionResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * Create a success response
 */
export function success<T = any>(
  message?: string,
  data?: T
): SuccessResponse<T> {
  return {
    success: true,
    ...(message && { message }),
    ...(data && { data }),
  };
}

/**
 * Create an error response
 */
export function error(
  message: string,
  details?: string,
  code?: string
): ErrorResponse {
  return {
    error: message,
    ...(details && { details }),
    ...(code && { code }),
  };
}

/**
 * Handle Zod validation errors
 */
export function handleZodError(err: ZodError): ErrorResponse {
  const firstError = err.errors[0];
  return error(
    firstError?.message || "Dữ liệu không hợp lệ",
    err.errors.map((e) => e.message).join(", "),
    "VALIDATION_ERROR"
  );
}

/**
 * Handle general errors with proper logging
 */
export function handleError(
  err: unknown,
  context: string = "Operation"
): ErrorResponse {
  console.error(`[${context}] Error:`, err);

  if (err instanceof ZodError) {
    return handleZodError(err);
  }

  if (err instanceof Error) {
    return error(err.message, err.stack, "INTERNAL_ERROR");
  }

  return error("Có lỗi xảy ra", undefined, "UNKNOWN_ERROR");
}

/**
 * Check if response is an error
 */
export function isError(response: ActionResponse): response is ErrorResponse {
  return "error" in response;
}

/**
 * Check if response is success
 */
export function isSuccess<T>(
  response: ActionResponse<T>
): response is SuccessResponse<T> {
  return "success" in response && response.success === true;
}
