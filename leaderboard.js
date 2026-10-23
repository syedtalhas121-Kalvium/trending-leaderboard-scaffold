// leaderboard.js — a trending leaderboard backed by a Redis sorted set + a hash per post.
//
// Storage shape:
//   trending:posts        (sorted set)  member = postId, score = engagement  -> the ranking
//   post:<id>:meta        (hash)        title, author                        -> the metadata

import Redis from "ioredis";
import "dotenv/config";

const redis = new Redis(process.env.REDIS_URL);

/** Record one unit of engagement with a single atomic Redis command. */
export async function upvote(postId) {
  return redis.zincrby("trending:posts", 1, postId);
}

/**
 * Fetch the top N posts, ranked high to low, with their metadata.
 * ZREVRANGE retrieves ids and scores; a pipeline batches all HGETALL calls.
 */
export async function getTop(n) {
  if (!Number.isInteger(n) || n <= 0) return [];

  const flat = await redis.zrevrange("trending:posts", 0, n - 1, "WITHSCORES");
  const rows = [];
  const pipeline = redis.pipeline();

  for (let i = 0; i < flat.length; i += 2) {
    const id = flat[i];
    rows.push({ id, score: Number(flat[i + 1]) });
    pipeline.hgetall(id + ":meta");
  }

  if (rows.length === 0) return [];

  const results = await pipeline.exec();
  return rows.map((row, k) => {
    const [error, metadata] = results[k];
    if (error) throw error;
    return { ...row, ...metadata };
  });
}

export { redis };
