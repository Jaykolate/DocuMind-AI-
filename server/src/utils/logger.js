const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const currentLevel = process.env.NODE_ENV === 'test' ? LOG_LEVELS.ERROR : LOG_LEVELS.DEBUG;

function formatTimestamp() {
  return new Date().toISOString();
}

function sanitize(message) {
  if (typeof message !== 'string') return message;
  // Mask potential API keys or secrets
  return message.replace(/AIza[0-9A-Za-z-_]{35}/g, 'AIza[REDACTED]');
}

export const logger = {
  debug: (msg, ...args) => {
    if (currentLevel <= LOG_LEVELS.DEBUG) {
      console.log(`[${formatTimestamp()}] [DEBUG] ${sanitize(msg)}`, ...args);
    }
  },
  info: (msg, ...args) => {
    if (currentLevel <= LOG_LEVELS.INFO) {
      console.log(`[${formatTimestamp()}] [INFO] ${sanitize(msg)}`, ...args);
    }
  },
  warn: (msg, ...args) => {
    if (currentLevel <= LOG_LEVELS.WARN) {
      console.warn(`[${formatTimestamp()}] [WARN] ${sanitize(msg)}`, ...args);
    }
  },
  error: (msg, ...args) => {
    if (currentLevel <= LOG_LEVELS.ERROR) {
      console.error(`[${formatTimestamp()}] [ERROR] ${sanitize(msg)}`, ...args);
    }
  }
};
