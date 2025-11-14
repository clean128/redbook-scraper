import winston from "winston";
import { CONFIG } from "../config.js";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf((i) => `${i.timestamp} [${i.level}]: ${i.message}`)
  ),
  transports: [
    new winston.transports.File({ filename: CONFIG.LOG_FILE }),
    new winston.transports.Console(),
  ],
});
