'use strict'

const fp = require('fastify-plugin')
const cookie = require('cookie')
const cookieSignature = require('cookie-signature')

function fastifyCookieSetCookie (reply, name, value, options, secret) {
  const opts = Object.assign({}, options || {})
  if (opts.expires && Number.isInteger(opts.expires)) {
    opts.expires = new Date(opts.expires)
  }

  if (opts.signed) {
    value = cookieSignature.sign(value, secret)
  }

  const serialized = cookie.serialize(name, value, opts)
  let setCookie = reply.getHeader('Set-Cookie')
  if (!setCookie) {
    reply.header('Set-Cookie', serialized)
    return reply
  }

  if (typeof setCookie === 'string') {
    setCookie = [setCookie]
  }

  setCookie.push(serialized)
  reply.removeHeader('Set-Cookie')
  reply.header('Set-Cookie', setCookie)
  return reply
}

function fastifyCookieClearCookie (reply, name, options) {
  const opts = Object.assign({ expires: new Date(1), path: '/' }, options || {})
  return fastifyCookieSetCookie(reply, name, '', opts)
}

function fastifyCookieOnReqHandler (fastifyReq, fastifyRes, done) {
  const cookieHeader = fastifyReq.req.headers.cookie
  fastifyReq.cookies = (cookieHeader) ? cookie.parse(cookieHeader) : {}
  done()
}

function plugin (fastify, options, next) {
  const secret = options ? options.secret || '' : ''

  fastify.decorateRequest('cookies', {})
  fastify.decorateReply('setCookie', function setCookieWrapper (name, value, options) {
    return fastifyCookieSetCookie(this, name, value, options, secret)
  })
  fastify.decorateReply('clearCookie', function clearCookieWrapper (name, options) {
    return fastifyCookieClearCookie(this, name, options)
  })
  fastify.decorateReply('unsignCookie', function unsignCookieWrapper (value) {
    return cookieSignature.unsign(value, secret)
  })
  fastify.addHook('onRequest', fastifyCookieOnReqHandler)
  next()
}

module.exports = fp(plugin, {
  fastify: '>=2.0.0',
  name: 'fastify-cookie'
})
