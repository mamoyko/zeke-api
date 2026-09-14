/** A rejection with a status code and a message safe to show the player. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const badRequest = (message: string) => new HttpError(400, message);
export const unauthorized = (message = "Not signed in.") => new HttpError(401, message);
export const conflict = (message: string) => new HttpError(409, message);
export const notFound = (message: string) => new HttpError(404, message);

/**
 * Wraps an async Express handler so a thrown/rejected error reaches Express's
 * error middleware instead of crashing the process — Express 4 doesn't do
 * this for you the way 5 does.
 */
import type { NextFunction, Request, Response } from "express";

export function asyncHandler<Req extends Request = Request>(
  fn: (req: Req, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req as Req, res, next).catch(next);
  };
}
