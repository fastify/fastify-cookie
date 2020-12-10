'use strict'

const fp = require('fastify-plugin')
const cookie = require('cookie')

const signerFactory = require('./signer')

function fastifyCookieSetCookie (reply, name, value, options, signer) {
  const opts = Object.assign({}, options || {})
  if (opts.expires && Number.isInteger(opts.expires)) {
    opts.expires = new Date(opts.expires)
  }

  if (opts.signed) {
    value = signer.sign(value)
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

function onReqHandlerWrapper (fastify) {
  return function fastifyCookieOnReqHandler (fastifyReq, fastifyRes, done) {
    fastifyReq.cookies = {} // New container per request. Issue #53
    const cookieHeader = fastifyReq.raw.headers.cookie
    if (cookieHeader) {
      fastifyReq.cookies = fastify.parseCookie(cookieHeader)
    }
    done()
  }
}

function plugin (fastify, options, next) {
  const secret = options.secret || ''

  const signer = typeof secret === 'string' ? signerFactory(secret) : secret

  fastify.decorate('parseCookie', function parseCookie (cookieHeader) {
    return cookie.parse(cookieHeader, options.parseOptions)
  })
  fastify.decorateRequest('cookies', null)
  fastify.decorateReply('setCookie', function setCookieWrapper (name, value, options) {
    return fastifyCookieSetCookie(this, name, value, options, signer)
  })
  fastify.decorateReply('clearCookie', function clearCookieWrapper (name, options) {
    return fastifyCookieClearCookie(this, name, options)
  })
  fastify.decorateReply('unsignCookie', function unsignCookieWrapper (value) {
    return signer.unsign(value)
  })
  fastify.addHook('onRequest', onReqHandlerWrapper(fastify))
  next()
}

module.exports = fp(plugin, {
  fastify: '>=3',
  name: 'fastify-cookie'
})
