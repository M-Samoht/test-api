const fetch = require('node-fetch')
const {
  onlyLoggedInMiddleware,
  getToken,
  getHashPassword,
  verifyPassword
} = require('../utils/user')
const API_KEY = process.env.API_KEY || '9922a1c'

const searchMovie = async query => {
  const res = await fetch(`http://www.omdbapi.com/?apikey=${API_KEY}${query}`)
  let { Search: movies, totalResults } = await res.json()
  if (!movies) {
    movies = []
    totalResults = 0
  }
  return { movies, totalResults }
}

const getMovie = async id => {
  const res = await fetch(`http://www.omdbapi.com/?apikey=${API_KEY}&i=${id}&plot=full`)
  return await res.json()
}

module.exports = {
  Query: {
    top: async (parent, { _id }, { Movie }) => {
      let movies = await Movie.aggregate([
        {
          '$project': {
            'Title': 1,
            'imdbID': 1,
            'likes': 1,
            'length': { '$size': '$likes' }
          }
        },
        { '$sort' : { 'length': -1 }},
        { '$limit': 1}
      ])
      let movie = await getMovie(movies[0].imdbID)
      movie.LikesCount = movies[0].likes.length
      return movie
    },
    user: async (parent, { _id }, { User }) => {
      return await User.findOne({ _id }).populate('likes')
    },
    users: async (parent, { page }, { User }) => {
      page = page || 1
      const users = await User.find().limit(10).skip(10 * (page - 1)).sort({ lastLogin: 'desc' }).populate('likes')
      const totalResults = await User.countDocuments()
      return { users, totalResults }
    },
    movies: async (parent, { query, page }, { Movie }) => {
      const moviesAPI = await searchMovie(
        `&t=movie&page=${page || 1}&s=pirate ${query || ''}`
      )

      let movies = await Movie.find()

      movies = moviesAPI.movies.map(movie => {
        const match = movies.find(item => item.imdbID === movie.imdbID)
        movie.LikesCount = match ? match.likes.length : 0
        return movie
      })
      const totalResults = moviesAPI.totalResults
      return { movies, totalResults }
    },
    movie: async (parent, { imdbID }, { Movie }) => {
      const movie = await getMovie(imdbID)
      const db = await Movie.findOne({ imdbID }).populate('likes')
      movie.LikesCount = db && db.likes ? db.likes.length : 0
      movie.likes = db && db.likes ? db.likes : []
      return movie
    },
    
  },
  Mutation: {
    login: async (parent, { username, password }, { User }) => {
      try {
        let user = await User.findOne({ username }).populate('likes')
        if (verifyPassword(password, user.password)) {
          user.lastLogin = Date.now()
          await user.save()
          return { user, token: await getToken(user) }
        } else {
          throw new Error('bad credentials')
        }
      } catch (e) {
        throw new Error('bad credentials')
      }
    },
    register: async (parent, values, { User }) => {
      values.password = getHashPassword(values.password)
      const user = await User.create(values)
      const token = await getToken(user)
      return { user, token }
    },
    user: onlyLoggedInMiddleware(
      async (parent, { username, birthday, email }, { auth, User, Movie }) => {
        let user = await User.findOne({ _id: auth.user._id }).populate('likes')
        if (!user) throw new Error('User not found')
        user.username = username
        user.email = email
        user.birthday = birthday
        await user.save()
        const token = await getToken(user)
        return {user, token}
      }
    ),
    toggleLike: onlyLoggedInMiddleware(
      async (parent, { imdbID }, { auth, User, Movie }) => {
        const { Title, Year, Type, Poster } = await getMovie(imdbID)
        if (!Title) throw new Error('Movie not found')
        const user = await User.findOne({ _id: auth.user._id })
        
        if (!user) throw new Error('User not found')
        const movie = await Movie.findOneOrCreate({
          imdbID,
          Title,
          Year,
          Type,
          Poster
        })
        
        if (!user.likes.includes(movie._id)) {
          if (user.likes.length >= 3) throw new Error('Too many likes')
          user.likes.push(movie._id)
          movie.likes.push(user._id)
        } else {
          user.likes = user.likes.filter(like => like.toString() !== movie._id.toString())
          movie.likes = movie.likes.filter(like => like.toString() !== user._id.toString())
        }
        await user.save()
        await movie.save()
        return await User.findOne({ _id: auth.user._id }).populate('likes')
      }
    )
  }
}
