const {test, after, describe, beforeEach} = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const assert = require("node:assert");

const api = supertest(app)
const Blog = require('../models/blog')
const User = require('../models/user')
let token;
beforeEach(async () => {
    await Blog.deleteMany({})
    await User.deleteMany({})
    //This is a way to wait for all promises to resolve in parallel
    // const blogObjects = helper.initialBlogs
    //     .map(blog => new Blog(blog))
    // const promiseArray = blogObjects.map(blog => blog.save())
    // await Promise.all(promiseArray)


    const newUser = {
        username: "Test",
        name: "Test User",
        password: "test"
    }

    await api.post('/api/users').send(newUser)


    const loginResponse = await api
        .post('/api/login')
        .send({username: newUser.username, password: newUser.password})

    token = loginResponse.body.token
    // This is a way to wait for all promises to resolve in series
    for (let blog of helper.initialBlogs) {
        let blogObject = new Blog(blog)
        await blogObject.save()
    }
})

describe('blog api', () => {
    test('blogs are returned as json', async () => {
        await api
            .get('/api/blogs')
            .expect(200)
            .expect('Content-Type', /application\/json/)
    })

    test('there are two blogs', async () => {
        const response = await api.get('/api/blogs')
        assert.strictEqual(response.body.length, helper.initialBlogs.length)
    })

    test('the first blog is about React patterns', async () => {
        const response = await api.get('/api/blogs')
        assert.strictEqual(response.body[0].title, 'React patterns')
    })

    test('a valid blog can be added', async () => {
        const users = await helper.usersInDb()
        const user = users[0]
        const newBlog = {
            userId: user.id,
            title: "Canonical string reduction",
            author: "Edsger W. Dijkstra",
            url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
            likes: 12
        }

        await api
            .post('/api/blogs')
            .set('Authorization', `Bearer ${token}`)
            .send(newBlog)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await helper.blogsInDb()
        assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)

        const titles = blogsAtEnd.map(blog => blog.title)
        assert(titles.includes('Canonical string reduction'))
    })

    test('a blog without url or title is not added', async () => {
        const users = await helper.usersInDb()
        const user = users[0]
        const newBlog = {
            userId: user.id,
            _id: "5a422b891b54a676234d17fa",
            title: "First class tests",
            author: "Robert C. Martin",
            likes: 10,
            __v: 0
        }
        await api
            .post('/api/blogs')
            .set('Authorization', `Bearer ${token}`)
            .send(newBlog)
            .expect(400)

        const blogsAtEnd = await helper.blogsInDb()
        assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
    })

    test('a specific blog can be viewed', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToView = blogsAtStart[0]

        const resultBlog = await api
            .get(`/api/blogs/${blogToView.id}`)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        assert.deepStrictEqual(resultBlog.body, blogToView)
    })

    test('a note can be deleted', async () => {
        const users = await helper.usersInDb()
        const user = users[0]

        const newBlog = {
            userId: user.id,
            title: "Temporary Blog",
            author: "Test Author",
            url: "http://example.com",
            likes: 5
        }

        const blogResponse = await api
            .post('/api/blogs')
            .set('Authorization', `Bearer ${token}`)
            .send(newBlog)
            .expect(201)

        const blogToDelete = blogResponse.body

        await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(204)

        const blogsAtEnd = await helper.blogsInDb()
        const titles = blogsAtEnd.map(blog => blog.title)

        assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
        assert(!titles.includes(blogToDelete.title))
    })

    test('identification is named id', async () => {
        const response = await api.get('/api/blogs')
        assert(response.body[0].id)
    })

    test('a blog without likes is added with 0 likes', async () => {
        const users = await helper.usersInDb()
        const user = users[0]
        const newBlog = {
            userId: user.id,
            _id: "5a422b3a1b54a676234d17f9",
            title: "Canonical string reduction",
            author: "Edsger W. Dijkstra",
            url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
            __v: 0
        }
        const response = await api
            .post('/api/blogs')
            .set('Authorization', `Bearer ${token}`)
            .send(newBlog)
            .expect(201)
            .expect('Content-Type', /application\/json/)
        assert.strictEqual(response.body.likes, 0)
    })

    test('a blog can be updated', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToUpdate = blogsAtStart[0]
        const updatedBlog = {
            _id: blogsAtStart[0].id,
            title: "Updated title",
            author: blogsAtStart[0].author,
            url: blogsAtStart[0].url,
            __v: 0
        }
        const response = await api
            .put(`/api/blogs/${blogToUpdate.id}`)
            .send(updatedBlog)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        assert.strictEqual(response.body.title, "Updated title")
    })
})


after(async () => {
    await mongoose.connection.close()
})