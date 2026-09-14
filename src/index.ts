import "./db"; // Runs schema setup on import — before anything can query it.
import { app } from "./app";
import { config, googleConfigured } from "./config";

app.listen(config.port, () => {
  console.log(`Zeke Mobile server listening on http://localhost:${config.port}`);
  console.log(`  Google Sign-In: ${googleConfigured() ? "configured" : "not configured (see auth/README.md)"}`);
});
