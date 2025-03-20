const _ = require('lodash')
const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    const reducer = (sum, item) => {
        return sum + item.likes
    }

    return blogs.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
    const reducer = (max, item) => {
        return max.likes > item.likes ? max : item
    }
    const favBlog = blogs.reduce(reducer, {likes: -1})
    return {
        title: favBlog.title,
        author: favBlog.author,
        likes: favBlog.likes
    }
}

const mostBlogs = (blogs) => {
    const groupedBlogs = _.countBy(blogs, 'author');
    const authorWithMostBlogs = _.maxBy(Object.entries(groupedBlogs), ([, count]) => count);

    return authorWithMostBlogs ? {author: authorWithMostBlogs[0], blogs: authorWithMostBlogs[1]} : null;
};

const mostLikes = (blogs) => {
    const groupedBlogs = _.groupBy(blogs, 'author');
    const authorWithMostLikes = _.maxBy(Object.entries(groupedBlogs), ([, blogs]) => totalLikes(blogs));

    return authorWithMostLikes ? {author: authorWithMostLikes[0], likes: totalLikes(authorWithMostLikes[1])} : null;
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes
}