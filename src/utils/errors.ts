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
 * Turns anything a controller might catch into a safe {status, message} pair
 * to send back — mirrors describeError() in api-template's
 * prospect.controller.ts, generalized into one shared helper since every
 * controller here wants the same HttpError-aware handling.
 */
export function describeError(error: unknown): { status: number; message: string } {
  if (error instanceof HttpError) {
    return { status: error.status, message: error.message };
  }
  console.error(error);
  return { status: 500, message: "Something went wrong on the server." };
}
