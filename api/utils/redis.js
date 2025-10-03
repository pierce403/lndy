import { createClient } from 'redis';

let redisClient = null;

/**
 * Get Redis client instance
 */
export const getRedisClient = async () => {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.LNDY_REDIS_URL;
  if (!redisUrl) {
    throw new Error('LNDY_REDIS_URL environment variable is not set');
  }

  redisClient = createClient({
    url: redisUrl,
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  await redisClient.connect();
  console.log('✅ Connected to Redis');
  
  return redisClient;
};

/**
 * Close Redis connection
 */
export const closeRedisConnection = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('✅ Redis connection closed');
  }
};
