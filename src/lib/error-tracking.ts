/**
 * Error tracking utility for centralized error logging
 *
 * In development: Logs to console
 * In production: Can be extended to send to error tracking services (Sentry, LogRocket, etc.)
 */

interface ErrorContext {
  [key: string]: unknown;
}

/**
 * Track and log errors with optional context
 *
 * @param error - The error to track
 * @param context - Optional additional context about the error
 */
export function trackError(error: Error, context?: ErrorContext): void {
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to error tracking service (e.g., Sentry)
    // Example: Sentry.captureException(error, { extra: context });
    console.error('[Error Tracking]', error, context);
  } else {
    // Development: Log to console with context
    console.error('[DEV Error]', error);
    if (context) {
      console.error('[DEV Error Context]', context);
    }
  }
}

/**
 * Track and log warning messages with optional context
 *
 * @param message - The warning message
 * @param context - Optional additional context
 */
export function trackWarning(message: string, context?: ErrorContext): void {
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to error tracking service
    // Example: Sentry.captureMessage(message, { level: 'warning', extra: context });
    console.warn('[Warning]', message, context);
  } else {
    // Development: Log to console
    console.warn('[DEV Warning]', message);
    if (context) {
      console.warn('[DEV Warning Context]', context);
    }
  }
}
