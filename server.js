const fs = require("fs");
const path = require("path");
require("dotenv").config();
const fastify = require("fastify")({
  logger: false,
});

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

fastify.get("/", async (request, reply) => {
  return reply.view("/src/pages/index.hbs");
});

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

fastify.post("/add-issue", async (request, reply) => {
  console.log("got to here");
  const form = request.body,
    issueNumber = form.issueNumber,
    modelName = form.modelName,
    modelCount = form.modelCount;

  const x = await db.upsertIssue(issueNumber, modelName, modelCount);

  console.log('server.js x: ', x);
  debugger;
});

// Get all issues
fastify.get('/issues', async (request, reply) => {
  try {
    console.log('Getting all issues')
    const issues = await db.getIssues();

    // Decide whether to return empty results

    return issues;
  } catch (err) {
    request.log.error(err); // Use Fastify's built-in logger
    reply.status(500).send({ error: 'Failed to fetch magazine issues' });
  }
})

// Get single issue
fastify.get('/issues/:id', async (request, reply) => {
  try {
    const id = request.params.id
    console.log(`Getting single issue with ID ${id}`);

    const issue = await db.getIssue(id)
    return issue
  } catch (err) {
    request.log.error(err);
    console.error(err)
    reply.status(500).send({ error: 'Error find this magazine' })
  }
})

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
