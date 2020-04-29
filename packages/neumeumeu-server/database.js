const rethinkdbdash = require("rethinkdbdash");

const r = rethinkdbdash({ port: process.env.DB_PORT });

async function initDB() {
  try {
    await r.tableCreate("player");
    await r.tableCreate("game");
  } catch (e) {}
}

module.exports = {
  r,
  initDB,
};
