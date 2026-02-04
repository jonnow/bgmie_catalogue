const user = { email: 'jonno@email.com', name: 'Jonathan', role: 'Admin' }

const userRoutes = async (fastify, options) => {
  fastify.get('/login', async (request, reply) => {
    // This is here for ease of development/testing, will move to the login POST later
    const token = fastify.jwt.sign({
      payload: {
        email: user
      }
    })

    // return login form
    return reply.send({ 'got to Login': token });
  });

  fastify.post('/login', async (request, reply) => {
    // check for user in the POST
    // To do - Set this to check the request.body for user
    if (user != null) {
      try {
        // Create the JWT for the login
        const token = fastify.jwt.sign({
          payload: user
        })

        // ? - To do: Save the token in the database?

        // Send email
        await sendMagicLinkEmail({ email: user.email, token })

        // To do: If the email couldn't be send, throw an error.
      } catch (error) {
        return reply.send('Error logging in. Please try again.');
      }
    }
    return reply.send('Check your email to finish logging in')
  });

  fastify.get('/verify', async (request, reply) => {
    const token = request.query.token

    // If no token, send unauthorised error
    if (token == null) {
      return reply.send({ status: 401 })
    }

    // We have a token...
    try {
      // Authorise the token
      const authToken = fastify.jwt.verify(token)

      // Set the payload object
      const payload = authToken.payload.email //look up user

      // Look up user in DB
      // to do

      // If we don't find the user, send back a generic error
      // To do: update this if to use the DB checked email
      if (!payload.email) {
        return reply.send('An error occurred, please try again')
      }

      // If we've found the user in the database, authorise them
      return reply.send(`Authorised as ${payload.name}`)

    } catch (error) {
      return reply.send({ error: error.message })
    }
  })

  fastify.get('/register', async (request, reply) => {
    // Send back the register form view
    return reply.send({ 'got to': 'register GET' });
  });

  fastify.post('/register', async (request, reply) => {
    // Create a JWT with their email

    // Send email to user with login JWT

    // Send back a message to check email
    return reply.send('Thank you for registering, please check your email for a sign-in link.');
  });
}

module.exports = userRoutes;