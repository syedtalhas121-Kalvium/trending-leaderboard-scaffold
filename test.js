// Prove that 50 upvotes move a seeded post into the top 10.
// Run npm run seed first, then npm test.

import assert from "node:assert/strict";
import { upvote, getTop, redis } from "./leaderboard.js";

async function run() {
  const target = "post:50";

  try {
    for (let i = 0; i < 50; i++) {
      await upvote(target);
    }

    const top = await getTop(10);
    console.log("Top 10:");
    top.forEach((p, i) => console.log(`  #${i + 1}  ${p.id}  score=${p.score}  ${p.title} (${p.author})`));

    const targetPost = top.find((p) => p.id === target);
    assert.ok(targetPost, `${target} should reach the top 10 after 50 upvotes`);
    assert.equal(targetPost.title, "Post number 50");
    assert.equal(targetPost.author, "@user50");
    console.log(`\nPASS ✅  ${target} reached the top 10`);
  } catch (error) {
    console.error("\nFAIL ❌", error);
    process.exitCode = 1;
  } finally {
    redis.disconnect();
  }
}

run();
