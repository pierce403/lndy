const NEYNAR_LOG_PREFIX = "🛡️ Neynar";

type NeynarLogContext = Record<string, unknown> | undefined;

export const logNeynarDebug = (message: string, context?: NeynarLogContext) => {
  if (context) {
    console.debug(`${NEYNAR_LOG_PREFIX} ▶️ ${message}`, context);
  } else {
    console.debug(`${NEYNAR_LOG_PREFIX} ▶️ ${message}`);
  }
};

export const logNeynarInfo = (message: string, context?: NeynarLogContext) => {
  if (context) {
    console.info(`${NEYNAR_LOG_PREFIX} ℹ️ ${message}`, context);
  } else {
    console.info(`${NEYNAR_LOG_PREFIX} ℹ️ ${message}`);
  }
};

export const logNeynarWarning = (message: string, context?: NeynarLogContext) => {
  if (context) {
    console.warn(`${NEYNAR_LOG_PREFIX} ⚠️ ${message}`, context);
  } else {
    console.warn(`${NEYNAR_LOG_PREFIX} ⚠️ ${message}`);
  }
};

export const logNeynarError = (message: string, error: unknown, context?: NeynarLogContext) => {
  const normalizedError = error instanceof Error ? error : new Error(String(error));

  console.groupCollapsed(`${NEYNAR_LOG_PREFIX} ❌ ${message}`);
  console.error("Error object:", normalizedError);
  if (normalizedError.stack) {
    console.error("Error stack:", normalizedError.stack);
  }
  if (context) {
    console.error("Error context:", context);
  }
  console.groupEnd();

  return normalizedError;
};
