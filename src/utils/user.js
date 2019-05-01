const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const JWT_KEY = process.env.JWT_KEY || 'jwtkey'

module.exports.onlyLoggedInMiddleware = (cb) => {
  return async (parent, values, context) => {
    context.auth = { loggedIn: false }
    const { ctx } = context
    try {
      const user = await jwt.verify(ctx.request.headers.authorization, JWT_KEY)
      context.auth = { user, loggedIn: true }
      return await cb(parent, values, context)
    } catch (e) {
      throw new Error(e)
    }
  }
}

module.exports.getToken = async (payload) => {
  return await jwt.sign(JSON.parse(JSON.stringify(payload)), JWT_KEY)
}
module.exports.getHashPassword = (password) => {
  return bcrypt.hashSync(password)
}

module.exports.verifyPassword = (password, hash) => {
  return bcrypt.compareSync(password, hash)
}