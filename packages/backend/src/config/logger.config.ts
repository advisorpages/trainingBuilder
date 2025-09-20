import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, context, trace, ...meta }) => {
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    const contextStr = context ? `[${context}] ` : '';
    const traceStr = trace ? `\n${trace}` : '';
    return `${timestamp} ${level}: ${contextStr}${message}${metaStr}${traceStr}`;
  })
);

export const createLoggerConfig = (nodeEnv = 'development') => {
  const isDevelopment = nodeEnv === 'development';
  const isProduction = nodeEnv === 'production';

  const transports: winston.transport[] = [];

  // Console transport for all environments
  transports.push(
    new winston.transports.Console({
      level: isDevelopment ? 'debug' : 'info',
      format: isDevelopment ? developmentFormat : logFormat,
    })
  );

  // File transports for production
  if (isProduction) {
    // General application logs
    transports.push(
      new winston.transports.File({
        filename: 'logs/app.log',
        level: 'info',
        format: logFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      })
    );

    // Error logs
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: logFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      })
    );

    // Security and audit logs
    transports.push(
      new winston.transports.File({
        filename: 'logs/security.log',
        level: 'warn',
        format: logFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 10,
      })
    );
  }

  return WinstonModule.createLogger({
    level: isDevelopment ? 'debug' : 'info',
    format: logFormat,
    transports,
    exceptionHandlers: [
      new winston.transports.File({ filename: 'logs/exceptions.log' })
    ],
    rejectionHandlers: [
      new winston.transports.File({ filename: 'logs/rejections.log' })
    ],
  });
};

// Security event logger
export const createSecurityLogger = () => {
  return winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.label({ label: 'SECURITY' })
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            return `${timestamp} 🔒 SECURITY ${level}: ${message} ${JSON.stringify(meta)}`;
          })
        )
      }),
      new winston.transports.File({
        filename: 'logs/security.log',
        maxsize: 10 * 1024 * 1024,
        maxFiles: 10,
      })
    ]
  });
};