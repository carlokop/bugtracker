/**
 * Plesk startup — Application Startup File: app.js (ESM fallback)
 */
import "./server/env-bootstrap.js";

import app from "./server/dist/index.js";

export default app;
