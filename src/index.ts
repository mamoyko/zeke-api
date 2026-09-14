import { app } from "./app";
import { config, googleConfigured } from "./config";

// Schema lives in prisma/schema.prisma now; `npm run db:migrate` applies it.
// Nothing here needs to run schema setup on import the way the old
// node:sqlite version did.

app.listen(config.port, () => {
  console.log(`Zeke Mobile server listening on http://localhost:${config.port}`);
  console.log(
    `  Google Sign-In: ${googleConfigured() ? "configured" : "not configured (see ../zeke-mobile/auth/README.md)"}`,
  );
});
