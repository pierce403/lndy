import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const directory = process.argv[2];
if (!directory) throw new Error("Pass the built asset directory");
const revision = process.env.CF_COMMIT_SHA || execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error("Invalid build revision");
mkdirSync(directory, { recursive: true });
writeFileSync(join(directory, "deployment.json"), JSON.stringify({ project: "lndy", revision }) + "\n");
