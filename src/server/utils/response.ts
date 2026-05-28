import { Response } from "express";

/**
 * Sends a standardized success API response
 */
export const sendSuccess = (
  res: Response, 
  message: string, 
  data: any = null, 
  statusCode: number = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Sends a standardized error API response
 */
export const sendError = (
  res: Response, 
  message: string, 
  error: any = null, 
  statusCode: number = 500
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: error instanceof Error ? error.message : error
  });
};

/**
 * Sends a standardized validation error API response
 */
export const sendValidationError = (
  res: Response, 
  message: string = "Validation failed", 
  details: Record<string, string> = {}
) => {
  return res.status(400).json({
    success: false,
    message,
    details
  });
};
