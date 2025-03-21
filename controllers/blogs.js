const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

//THERE ARE NO TRY CATCH BLOCKS IN THIS FILE BECAUSE WE ARE USING express-async-errors

blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({}).populate('user', {username: 1, name: 1})
    response.json(blogs)
})

blogsRouter.get('/:id', async (request, response, next) => {
    const blog = await Blog.findById(request.params.id)
    if (blog) {
        response.json(blog)
    } else {
        response.status(404).end()
    }
})

blogsRouter.post('/', async (request, response, next) => {
    const body = request.body

    if (!request.user) {
        return response.status(401).json({ error: 'unauthorized' })
    }

    const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes,
        user: request.user.id
    })

    const savedBlog = await blog.save()
    request.user.blogs = request.user.blogs.concat(savedBlog._id)
    await request.user.save()
    response.status(201).json(savedBlog)

})

blogsRouter.delete('/:id', async (request, response, next) => {
    if (!request.user) {
        return response.status(401).json({error: 'unauthorized'})
    }
    const blog = await Blog.findById(request.params.id)
    if (!blog) {
        return response.status(404).json({error: 'blog not found'})
    }

    if (blog.user.toString() !== request.user.id.toString()) {
        return response.status(403).json({error: 'not authorized to delete this blog'})
    }

    await Blog.findByIdAndDelete(request.params.id)
    response.status(204).end()
})

blogsRouter.put('/:id', async (request, response, next) => {
    const body = request.body

    const blog = {
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes,
    }

    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, {new: true})
    response.json(updatedBlog)

})

module.exports = blogsRouter