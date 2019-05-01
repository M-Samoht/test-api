const { GraphQLServer } = require('graphql-yoga')
const mongoose = require('mongoose')

const models = require('./mongo')

const db = mongoose.connect(
  process.env.MONGO_URI || 'mongodb://blablamovie:passpass12@ds011492.mlab.com:11492/kreaktiv',
  {
    useNewUrlParser: true,
    autoIndex: false
  }
)

const context = {
  ...models,
  db
}

const server = new GraphQLServer({
  typeDefs: `${__dirname}/graphql/schema.graphql`,
  resolvers: require('./graphql/resolvers'),
  context: ctx => ({ ...context, ctx })
})

module.exports = server