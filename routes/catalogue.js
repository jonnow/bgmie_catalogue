

const catalogueRoutes = async (fastify, options) => {
  // From the decorators (server.js, line ~44)
  const dbHelper = options.db;

  fastify.post("/add-issue", async (request, reply) => {
    console.log("got to here");
    const form = request.body,
      issueNumber = form.issueNumber,
      modelName = form.modelName,
      modelCount = form.modelCount;

    const x = await dbHelper.upsertIssue(issueNumber, modelName, modelCount);

    console.log('server.js x: ', x);
    debugger;
  });

  // Get all issues
  fastify.get('/issues', async (request, reply) => {
    try {
      console.log('Getting all issues');

      const issues = dbHelper.getIssues(fastify);

      // Decide whether to return empty results
      return reply.view('/src/pages/issues.hbs', { issues: issues });
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

      const issue = dbHelper.getIssue(fastify, id)
      return issue
    } catch (err) {
      request.log.error(err);
      console.error(err)
      reply.status(500).send({ error: 'Error find this magazine' })
    }
  })

  // Get only specials
  fastify.get('/issues/specials', async (request, reply) => {
    try {
      return dbHelper.getSpecials(fastify);
    } catch (err) {
      console.error(`Error fetching specials: ${error}`)
    }
  })

  // Get models
  fastify.get('/models', async (request, reply) => {
    try {
      return dbHelper.getModels(fastify);
    } catch (err) {
      console.error(`Error fetching all models: ${err}`)
    }
  })

  fastify.get('/factions', async (request, reply) => {
    try {
      return dbHelper.getFactions(fastify);
    } catch (err) {
      console.error(`Error fetching all factions: ${err}`)
    }
  })

  fastify.get('/factions/:id', async (request, reply) => {
    try {
      const id = request.params.id
      console.info(`Getting factions with ID: ${id}`)
      const faction = dbHelper.getFaction(fastify, id);
      const factionModels = dbHelper.getFactionModels(fastify, faction[0].id);
      return { faction, factionModels }
    } catch (err) {
      console.error(`Error fetching single faction: ${err}`)
      request.log.error(err);
      reply.status(500).send({ error: 'Error finding this faction' })
    }
  })
}

module.exports = catalogueRoutes;