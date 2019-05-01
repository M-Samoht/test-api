const faker = require('faker')
const fetch = require('node-fetch')


const getPage = async (page) => {

  const body = {
    operationName: "movies",
    variables: {
      search: "",
      page: page,
    },
    query:`
    query movies($search: String!, $page: Int!) {
      movies(query: $search, page: $page) {
        movies {
          imdbID
          Title
          Poster
          LikesCount
          Year
        }
        totalResults
      }
    }`
  }
  let data
  try {
    let res = await fetch('http://localhost:4000', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    return await res.json()
  } catch (e) {
    console.error(e)
  }
}
const toggleLike = async (token, imdbID) => {

  const body = {
    operationName: "toggleLike",
    variables: {
      imdbID
    },
    query:`
    mutation toggleLike($imdbID: String!) {
      toggleLike(imdbID: $imdbID) {
        username
        likes {
          imdbID
        }
      }
    }`
  }
  let data
  try {
    let res = await fetch('http://localhost:4000', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify(body)
    })
    return await res.json()
  } catch (e) {
    console.error(e)
  }
}
const register = async (username, email, password) => {

  const body = {
    operationName: "register",
    variables: { username, email, password},
    query:`
    mutation register($username: String!, $email: String!, $password: String!) {
      register(username: $username, email: $email, password: $password) {
        token
      }
    }`
  }
  let data
  try {
    let res = await fetch('http://localhost:4000', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    return await res.json()
  } catch (e) {
    console.error(e)
  }
}




const init = async () => {
  let movies = []
  let maxMovies = 237
  let userNumber = 40
  const pages = Math.ceil(maxMovies / 10)
  for (let i = 1; i <= pages; i++) {
    let { data } = await getPage(i)
    // console.log(data)
    movies.push(...data.movies.movies)
    console.log(`fetch all pirates movies (page ${i} / ${pages})`)
  }
  console.log(`${movies.length} movies fetched`)
  console.log(`createing ${userNumber} users...`)
  for (let i = 0; i < userNumber; i++) {
    const username = faker.internet.userName()
    const email = faker.internet.email()
    const user = await register(username, email, username)
    for (let j = 0; j < 3; j++) {
      await toggleLike(user.data.register.token, movies[Math.floor(Math.random() * movies.length)].imdbID)
    }
  }
}

init()

