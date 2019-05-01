const { Schema, model } = require('mongoose')

const MovieSchema = new Schema({
  Title: {
    type: String,
    required: true
  },
  Year: {
    type: String,
    required: true
  },
  imdbID: {
    type: String,
    required: true
  },
  Type: {
    type: String,
    required: true
  },
  Poster: {
    type: String,
    required: true
  },
  likes: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updateddAt: {
    type: Date,
    default: Date.now
  }
})

MovieSchema.statics = {
  findOneOrCreate: async function(condition, callback) {
    const self = this
    const result = await self.findOne(condition)
    return result ? result : await self.create(condition)
  }
}

module.exports = model('Movie', MovieSchema)
