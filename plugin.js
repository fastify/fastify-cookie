'use strict'

const fp = require('fastify-plugin')
const cookie = require('cookie')

function fastifyCookieSetCookie (name, value, options) {
  const opts = Object.assign({}, options || {})
  if (opts.expires && Number.isInteger(opts.expires)) {
    opts.expires = new Date(opts.expires)
  }

  const serialized = cookie.serialize(name, value, opts)
  let setCookie = this.getHeader('Set-Cookie')
  if (!setCookie) {
    this.header('Set-Cookie', serialized)
    return this
  }

  if (typeof setCookie === 'string') {
    setCookie = [setCookie]
  }

  setCookie.push(serialized)
  this.removeHeader('Set-Cookie')
  this.header('Set-Cookie', setCookie)
  return this
}

function fastifyCookieClearCookie (name, options) {
  const opts = Object.assign({ expires: new Date(1), path: '/' }, options || {})
  return fastifyCookieSetCookie.call(this, name, '', opts)
}

function fastifyCookieOnReqHandler (fastifyReq, fastifyRes, done) {
  const cookieHeader = fastifyReq.req.headers.cookie
  fastifyReq.cookies = (cookieHeader) ? cookie.parse(cookieHeader) : {}
  done()
}

function plugin (fastify, options, next) {
  fastify.decorateRequest('cookies', {})
  fastify.decorateReply('setCookie', fastifyCookieSetCookie)
  fastify.decorateReply('clearCookie', fastifyCookieClearCookie)
  fastify.addHook('onRequest', fastifyCookieOnReqHandler)
  next()
}

module.exports = fp(plugin, {
  fastify: '>=2.0.0',
  name: 'fastify-cookie'
})
