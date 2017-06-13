'use strict'

// npm
const Router = require('express').Router
const jsonParser = require('body-parser').json()
const createError = require('http-errors')
const debug = require('debug')('slugram:gallery-route')

// app
const Gallery = require('../model/gallery.js')
const bearerAuth = require('../lib/bearer-auth-middleware.js')
const pageQueries = require('../lib/query-middleware.js')

// constants
const galleryRouter = module.exports = Router()

galleryRouter.post('/api/gallery', bearerAuth, jsonParser, function(req, res, next){
  debug('POST /api/gallery')
  req.body.userID = req.user._id
  new Gallery(req.body).save()
  .then( gallery => res.json(gallery))
  .catch(next)
})


galleryRouter.get('/api/gallery/:id', bearerAuth, function(req, res, next){
  debug('GET /api/gallery/:id')
  Gallery.findById(req.params.id)
  .catch(err => Promise.reject(createError(400, err.message)))
  .then(gallery => {
    if (gallery.userID.toString() !== req.user._id.toString())
      return Promise.reject(createError(401, 'invalid userid'))
    res.json(gallery)
  })
  .catch(next)
})

galleryRouter.put('/api/gallery/:id', bearerAuth, jsonParser, function(req, res, next){
  debug('PUT /api/gallery/:id')
  Gallery.findById(req.params.id)
  .catch(err => Promise.reject(createError(404, err.message)))
  .then(gallery => {
    if (gallery.userID.toString() !== req.user._id.toString()) 
      return Promise.reject(createError(401, 'not users gallery'))
    let options = { runValidators: true, new: true}
    return Gallery.findByIdAndUpdate(req.params.id, req.body, options)
  })
  .then(gallery => res.json(gallery))
  .catch(next)
})

galleryRouter.delete('/api/gallery/:id', bearerAuth, function(req, res, next){
  debug('DELETE /api/gallery/:id')
  Gallery.findById(req.params.id)
  .catch(err => Promise.reject(createError(404, err.message)))
  .then(gallery => {
    if (gallery.userID.toString() !== req.user._id.toString()) 
      return Promise.reject(createError(401, 'not users gallery'))
    return gallery.remove()
  })
  .then(() => res.sendStatus(204))
  .catch(next)
})

galleryRouter.get('/api/gallery', bearerAuth, pageQueries, function(req, res, next){
  debug('GET /api/gallery')

  let offset = req.query.offset
  let page = req.query.page
  let pagesize = req.query.pagesize
  let sort = req.query.sort
  if (page > 1) 
    offset =  (req.query.page - 1) * req.query.pagesize + req.query.offset
  
  console.log('THAT OFFSET', offset)
  console.log('THAT PAGE', page)
  console.log('THAT PAGESIZE', pagesize)
  Gallery.find({userID: req.user._id.toString()})
  .sort({_id: sort}).skip(offset).limit(req.query.pagesize)
  .then(galleries => res.json(galleries))
  .catch(next)
})
