"use strict";

const app = require("./app");
const env = require("./config/env");

const server = app.listen(env.port, () => {
  console.log(`ELMS API listening on http://localhost:${env.port} (${env.nodeEnv})`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down.`);
  server.close(() => process.exit(0));
}

["SIGINT", "SIGTERM"].forEach((sig) => process.on(sig, () => shutdown(sig)));
