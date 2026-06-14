const fs = require("fs");
const path = require("path");
require("dotenv").config();
const fastify = require("fastify")({
  logger: false,
});

fastify.register(require('@punkish/fastify-better-sqlite3'), {
  pathToDb: './.data/choices.db',
  // better-sqlite3 specific options
  betterSqlite3options: { verbose: console.log }
});

fastify.register(require('@fastify/jwt'), {
  secret: process.env.JWT_SIGNING_SECRET
})

fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/",
});

fastify.register(require("@fastify/formbody"));

fastify.register(require("@fastify/view"), {
  engine: {
    handlebars: require("handlebars"),
  },
});

const data = require("./src/data.json");
const seo = require("./src/seo.json");
if (seo.url === "glitch-default") {
  seo.url = `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
}

const db = require("./src/" + data.database);

// Decorate the Fastify instance, i.e. add new properties to the Fastify instance
fastify.decorate('db', db);
fastify.decorate('data', data);

// Clean routes
fastify.register(require('./routes/user'));
// Pass dbHelpers explicitly as an option to the catalogue routes
fastify.register(require('./routes/catalogue'), { db: db });

// Messy routing
fastify.get("/", async (request, reply) => {
  return reply.view("/src/pages/index.hbs");
});

// Test the authentication
fastify.get('/test', { preHandler: auth }, (request, reply) => {
  return { 'protected': 'secret message' }
});

async function auth(request, reply) {
  const apiKey = request.headers['x-api-key'];
  const knownKey = 'known-api-key'; // Typically, this would be stored securely

  if (apiKey !== knownKey) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
}

/**
 * This was related to the Choices DB. A demo table/db to get going.
 * Keeping this snippet for reference in future.
 */
// fastify.post("/", async (request, reply) => {
//   let params = request.query.raw ? {} : { seo: seo };
//   console.log("params:", params);
//   params.results = true;

//   let options;

//   if (request.body.language) {
//     options = await db.processVote(request.body.language);
//     if (options) {
//       params.optionNames = options.map((choice) => choice.language);
//       params.optionCounts = options.map((choice) => choice.picks);
//     }
//   }

//   params.error = options ? null : data.errorMessage;

//   return request.query.raw
//     ? reply.send(params)
//     : reply.view("/src/pages/index.hbs", params);
// });



fastify.listen(
  { port: process.env.PORT, host: "0.0.0.0" },
  function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
  }
);
