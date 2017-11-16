'use strict'

const fp = require('fastify-plugin')
const cookie = require('cookie')

function fastifyCookieSetCookie (name, value, options) {
  const seriaized = cookie.serialize(name, value, options || {})
  this.header('Set-Cookie', seriaized)
  return this
}

function fastifyCookiePreHandler (fastifyReq, fastifyRes, done) {
  const cookieHeader = fastifyReq.req.headers.cookie
  fastifyReq.cookies = (cookieHeader) ? cookie.parse(cookieHeader) : {}
  done()
}

function plugin (fastify, options, next) {
  fastify.decorateRequest('cookies', {})
  fastify.decorateReply('setCookie', fastifyCookieSetCookie)
  fastify.addHook('preHandler', fastifyCookiePreHandler)
  next()
}

module.exports = fp(plugin, '>=0.34.0')
