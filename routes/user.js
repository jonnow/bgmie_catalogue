

const userRoutes = async (fastify, options) => {
  fastify.get('/login', async (request, reply) => {
    // return login form
    const token = fastify.jwt.sign({
      payload: {
        email: 'jonno@email.com', firstName: 'Jonathan', role: 'Admin'
      }
    })
    return reply.send({ 'got to Login': token });
  });

  fastify.post('/login', async (request, reply) => {
    // check for user
    const user = { email: "jonnowitts@gmail.com" }
    if (user != null) {
      try {
        const token = fastify.jwt.sign({
          payload: {
            email: 'jonno@email.com', firstName: 'Jonathan', role: 'Admin'
          }
        })

        debugger
        // send email
        await sendMagicLinkEmail({ email: user.email, token })
      } catch (error) {
        return reply.send('Error logging in. Please try again.');
      }
    }
    return reply.send('Check your email to finish logging in')
  });

  fastify.get('/verify', async (request, reply) => {
    const token = request.query.token
    if (token == null) return reply.status(401)
    try {
      const decodeToken = token
      const user = '' //look up user
      return reply.send(`Authorised as ${user}`)
    } catch (error) {
      return reply.status(401)
    }
  })

  fastify.get('/register', async (request, reply) => {
    return reply.send({ 'got to': 'register GET' });
  });

  fastify.post('/register', async (request, reply) => {
    return reply.send({ 'got to': 'register POST' });
  });
}

module.exports = userRoutes;