import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { esProduccion } from './entorno';

const formatoConsola = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'DD/MM/YYYY HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const extras = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${extras}`;
  })
);

const formatoArchivo = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transportes: winston.transport[] = [
  new winston.transports.Console({
    format: formatoConsola,
    silent: process.env.NODE_ENV === 'test',
  }),
];

if (esProduccion) {
  transportes.push(
    new DailyRotateFile({
      filename: path.join('logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: formatoArchivo,
      maxFiles: '30d',
    }),
    new DailyRotateFile({
      filename: path.join('logs', 'combinado-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: formatoArchivo,
      maxFiles: '14d',
    })
  );
}

export const logger = winston.createLogger({
  level: esProduccion ? 'warn' : 'debug',
  transports: transportes,
  exceptionHandlers: [
    new winston.transports.Console({ format: formatoConsola }),
  ],
});
