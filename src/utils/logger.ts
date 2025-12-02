/**
 * Professional Logger Utility
 * Centralized logging with environment-aware output control
 * 
 * In production: Only errors and warnings are logged
 * In development: All logs are shown with timestamps and categories
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  isDevelopment: boolean;
  enabledLevels: LogLevel[];
}

const config: LoggerConfig = {
  isDevelopment: import.meta.env.DEV,
  enabledLevels: import.meta.env.DEV 
    ? ['debug', 'info', 'warn', 'error'] 
    : ['warn', 'error'],
};

const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const levelColors: Record<LogLevel, string> = {
  debug: '#6B7280', // gray
  info: '#3B82F6',  // blue
  warn: '#F59E0B',  // amber
  error: '#EF4444', // red
};

const levelEmojis: Record<LogLevel, string> = {
  debug: '🔍',
  info: '📋',
  warn: '⚠️',
  error: '❌',
};

function shouldLog(level: LogLevel): boolean {
  return config.enabledLevels.includes(level);
}

function formatMessage(level: LogLevel, category: string, message: string): string {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  return `${levelEmojis[level]} [${timestamp}] [${category}] ${message}`;
}

function createLogMethod(level: LogLevel) {
  return (category: string, message: string, ...args: unknown[]) => {
    if (!shouldLog(level)) return;
    
    const formattedMessage = formatMessage(level, category, message);
    
    if (config.isDevelopment) {
      const style = `color: ${levelColors[level]}; font-weight: bold;`;
      switch (level) {
        case 'debug':
          console.debug(`%c${formattedMessage}`, style, ...args);
          break;
        case 'info':
          console.info(`%c${formattedMessage}`, style, ...args);
          break;
        case 'warn':
          console.warn(formattedMessage, ...args);
          break;
        case 'error':
          console.error(formattedMessage, ...args);
          break;
      }
    } else {
      // Production: minimal output
      switch (level) {
        case 'warn':
          console.warn(formattedMessage, ...args);
          break;
        case 'error':
          console.error(formattedMessage, ...args);
          break;
      }
    }
  };
}

export const logger = {
  debug: createLogMethod('debug'),
  info: createLogMethod('info'),
  warn: createLogMethod('warn'),
  error: createLogMethod('error'),
  
  // Convenience methods with default categories
  auth: {
    debug: (message: string, ...args: unknown[]) => createLogMethod('debug')('Auth', message, ...args),
    info: (message: string, ...args: unknown[]) => createLogMethod('info')('Auth', message, ...args),
    warn: (message: string, ...args: unknown[]) => createLogMethod('warn')('Auth', message, ...args),
    error: (message: string, ...args: unknown[]) => createLogMethod('error')('Auth', message, ...args),
  },
  
  api: {
    debug: (message: string, ...args: unknown[]) => createLogMethod('debug')('API', message, ...args),
    info: (message: string, ...args: unknown[]) => createLogMethod('info')('API', message, ...args),
    warn: (message: string, ...args: unknown[]) => createLogMethod('warn')('API', message, ...args),
    error: (message: string, ...args: unknown[]) => createLogMethod('error')('API', message, ...args),
  },
  
  cache: {
    debug: (message: string, ...args: unknown[]) => createLogMethod('debug')('Cache', message, ...args),
    info: (message: string, ...args: unknown[]) => createLogMethod('info')('Cache', message, ...args),
    warn: (message: string, ...args: unknown[]) => createLogMethod('warn')('Cache', message, ...args),
    error: (message: string, ...args: unknown[]) => createLogMethod('error')('Cache', message, ...args),
  },
  
  offline: {
    debug: (message: string, ...args: unknown[]) => createLogMethod('debug')('Offline', message, ...args),
    info: (message: string, ...args: unknown[]) => createLogMethod('info')('Offline', message, ...args),
    warn: (message: string, ...args: unknown[]) => createLogMethod('warn')('Offline', message, ...args),
    error: (message: string, ...args: unknown[]) => createLogMethod('error')('Offline', message, ...args),
  },
  
  prayer: {
    debug: (message: string, ...args: unknown[]) => createLogMethod('debug')('Prayer', message, ...args),
    info: (message: string, ...args: unknown[]) => createLogMethod('info')('Prayer', message, ...args),
    warn: (message: string, ...args: unknown[]) => createLogMethod('warn')('Prayer', message, ...args),
    error: (message: string, ...args: unknown[]) => createLogMethod('error')('Prayer', message, ...args),
  },
  
  sw: {
    debug: (message: string, ...args: unknown[]) => createLogMethod('debug')('ServiceWorker', message, ...args),
    info: (message: string, ...args: unknown[]) => createLogMethod('info')('ServiceWorker', message, ...args),
    warn: (message: string, ...args: unknown[]) => createLogMethod('warn')('ServiceWorker', message, ...args),
    error: (message: string, ...args: unknown[]) => createLogMethod('error')('ServiceWorker', message, ...args),
  },
  
  tts: {
    debug: (message: string, ...args: unknown[]) => createLogMethod('debug')('TTS', message, ...args),
    info: (message: string, ...args: unknown[]) => createLogMethod('info')('TTS', message, ...args),
    warn: (message: string, ...args: unknown[]) => createLogMethod('warn')('TTS', message, ...args),
    error: (message: string, ...args: unknown[]) => createLogMethod('error')('TTS', message, ...args),
  },
  
  db: {
    debug: (message: string, ...args: unknown[]) => createLogMethod('debug')('Database', message, ...args),
    info: (message: string, ...args: unknown[]) => createLogMethod('info')('Database', message, ...args),
    warn: (message: string, ...args: unknown[]) => createLogMethod('warn')('Database', message, ...args),
    error: (message: string, ...args: unknown[]) => createLogMethod('error')('Database', message, ...args),
  },
};

export default logger;
