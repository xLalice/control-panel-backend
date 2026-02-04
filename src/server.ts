import "dotenv/config";
import app from "./app";
import { error, info } from "./utils/logger";

const PORT = Number(process.env.PORT) || 5000;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  info(`Server running on http://${HOST}:${PORT}`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  error("Server failed to start:", err.message);
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Please use a different port.`
    );
  }
  process.exit(1);
});