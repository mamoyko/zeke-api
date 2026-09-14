// src/server.ts
import app from "./app";
import { PORT } from "./config";
import { googleConfigured } from "./config";

app.listen(PORT, () => {
  console.log(`Zeke Mobile server listening on http://localhost:${PORT}`);
  console.log(
    `  Google Sign-In: ${googleConfigured() ? "configured" : "not configured (see ../zeke-mobile/auth/README.md)"}`,
  );
});
