import { createClient, RedisClientType } from "redis";
import { env } from "./env";

const redisClient = createClient({
  url: env.REDIS_URL,
  socket: {
    connectTimeout: 10000, 
    keepAlive: 5000,
  }
}) as RedisClientType;

redisClient.on("error", (err: unknown) => {
  console.error("Redis Client Error", err);
});
redisClient.on("connect", () => {
  console.log("Redis Client connected");
});
redisClient.on("reconnection", () => console.log("Redis Client reconnected"));

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error("Failed to connect to redis: ", err);
  }
})();

process.on("SIGINT", async () => {
  await redisClient.quit();
  console.log("Redis client disconnected due to app termination");
  process.exit(0);
});

export default redisClient;
