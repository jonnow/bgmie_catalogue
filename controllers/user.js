const { default: fastifyJwt } = require('@fastify/jwt');
const userHelper = require('./../src/helpers/user');

/**
 * User related functions:
 *  - Login
 *  - Verify
 *  - Register
 *  - Delete account
 */

module.exports = {
  loginUser:
    async function login(incomingEmail) {
      // Check if user exists
      const user = 'jonno' // = find user(incomingEmail)

      if (user) {
        // get JWT

        // send email with token

        return { 'status': '200 - Check your email' }
      }

      // otherwise send ambiguous message back
      return 'Error logging in. Please try again.'
    },
  verifyAccount:
    async function verify(query) {
      const token = query.token;

      // If no token, return error
      if (token == null) {
        return 401; // 401 - unauthorised
      }

      try {
        // decode JWT token
        const token = fastify.jwt.sign({
          payload: {
            email: 'jonno@email.com', firstName: 'Jonathan', role: 'Admin'
          }
        })

        return token

        const email = 'jonno' // email

        // check user
        const user = userHelper.findUser(email)

        // send back authorisation
      } catch (error) {
        console.error('Error: ', error)
        return 501; // decoding token error 
      }
    },
  registerAccount:
    async function register(form) {
      // look up email to see if user registered
      const user // = find in db

      // if yes, call login function
      if (user) {
        return login(user.email);
      }

      // else: 
      // create new user entry in DB

      // send email with link


      // We don't want to create an account until verified
    },
  deleteAccount:
    async function deleteAccount(email) {
      // !!! User should be logged in at this point !!!

      // look up email to see if user registered
      const user // = find in db

      if (user) {
        // delete this user from the database

        return { 'status': 200 } // done
      }

      // else, no user, just say it's been done
      return { 'status': 201 }
    }
}