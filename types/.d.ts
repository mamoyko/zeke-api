declare namespace Express {
  interface Request {
    /** Set by requireAuth (src/middleware/require-auth.middleware.ts). */
    userId?: string;
  }
}
