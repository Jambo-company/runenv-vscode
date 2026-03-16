const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getEnvFileProfiles,
  inferEnvFileProfileIdFromFilename,
  formatDotenvValue,
} = require("../dist/env-files.js");

test("docker compose preset uses override filenames for local profiles", () => {
  const profiles = getEnvFileProfiles("Preview", "dockerCompose");

  assert.equal(
    profiles.find((profile) => profile.id === "local")?.filename,
    ".env.override"
  );
  assert.equal(
    profiles.find((profile) => profile.id === "environmentLocal")?.filename,
    ".env.preview.override"
  );
});

test("nextjs preset resolves environment-local filenames", () => {
  const profiles = getEnvFileProfiles("Production", "nextjs");

  assert.equal(
    profiles.find((profile) => profile.id === "environment")?.filename,
    ".env.production"
  );
  assert.equal(
    profiles.find((profile) => profile.id === "environmentLocal")?.filename,
    ".env.production.local"
  );
});

test("profile inference matches filenames from the selected preset", () => {
  assert.equal(
    inferEnvFileProfileIdFromFilename(
      "production",
      "/tmp/.env.production.local",
      "nextjs"
    ),
    "environmentLocal"
  );
  assert.equal(
    inferEnvFileProfileIdFromFilename(
      "preview",
      "/tmp/.env.override",
      "dockerCompose"
    ),
    "local"
  );
});

test("dotenv formatting quotes and escapes special characters", () => {
  assert.equal(formatDotenvValue("plain_value"), "plain_value");
  assert.equal(formatDotenvValue('value with "quotes"'), '"value with \\"quotes\\""');
  assert.equal(formatDotenvValue("has space"), '"has space"');
});
