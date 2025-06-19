import { createClient, RedisClientType } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
}) as RedisClientType;

redisClient.on("error", (err) => console.error("Redis Client error: ", err));
redisClient.on("connect", () => {
  console.log("Redis Client connected");
});
redisClient.on("reconnection", () => console.log("Redis Client reconnected"));

(async () => {
    try {
        await redisClient.connect();
    } catch (err ){
        console.error("Failed to connect to redis: ", err);
    }
})();

process.on('SIGINT', async () => {
    await redisClient.quit();
    console.log('Redis client disconnected due to app termination');
    process.exit(0);
});

export default redisClient;