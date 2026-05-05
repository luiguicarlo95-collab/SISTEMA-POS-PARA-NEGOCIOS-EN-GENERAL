import { Request, Response, NextFunction } from "express";

export interface CustomError extends Error {
  statusCode?: number;
  details?: any;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Error interno del servidor";
  
  console.error(`[Error] ${req.method} ${req.url}:`, {
    message,
    statusCode,
    details: err.details,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });

  res.status(statusCode).json({
    error: message,
    details: err.details || null,
    status: statusCode
  });
};
