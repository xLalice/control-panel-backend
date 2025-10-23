import app from "./app";
import { error, info } from "./utils/logger";

import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 5000;
app
  .listen(PORT, () => {
    info(`Server running on port ${PORT}`);
  })
  .on("error", (err: NodeJS.ErrnoException) => {
    error("Server failed to start:", err.message);
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. Please use a different port.`
      );
    }
    process.exit(1);
  });
