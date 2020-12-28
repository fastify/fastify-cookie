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
  const opts = Object.assign({ path: '/' }, options || { }, {
    expires: new Date(1),
    signed: undefined,
    maxAge: undefined
  })
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
  const enableRotation = Array.isArray(secret)
  const signer = typeof secret === 'string' || enableRotation ? signerFactory(secret) : secret

  fastify.decorate('parseCookie', function parseCookie (cookieHeader) {
    return cookie.parse(cookieHeader, options.parseOptions)
  })
  fastify.decorateRequest('cookies', null)
  fastify.decorateRequest('unsignCookie', function unsignCookieRequestWrapper (value) {
    return signer.unsign(value)
  })
  fastify.decorateReply('setCookie', function setCookieWrapper (name, value, options) {
    return fastifyCookieSetCookie(this, name, value, options, signer)
  })
  fastify.decorateReply('clearCookie', function clearCookieWrapper (name, options) {
    return fastifyCookieClearCookie(this, name, options)
  })

  fastify.decorateReply('unsignCookie', function unsignCookieReplyWrapper (value) {
    return signer.unsign(value)
  })
  fastify.addHook('onRequest', onReqHandlerWrapper(fastify))
  next()
}

const fastifyCookie = fp(plugin, {
  fastify: '>=3',
  name: 'fastify-cookie'
})

/**
 * These export configurations enable JS and TS developers
 * to consume fastify-cookie in whatever way best suits their needs.
 * Some examples of supported import syntax includes:
 * - `const fastifyCookie = require('fastify-cookie')`
 * - `const { fastifyCookie } = require('fastify-cookie')`
 * - `import * as fastifyCookie from 'fastify-cookie'`
 * - `import { fastifyCookie } from 'fastify-cookie'`
 * - `import fastifyCookie from 'fastify-cookie'`
 */
fastifyCookie.fastifyCookie = fastifyCookie
fastifyCookie.default = fastifyCookie
module.exports = fastifyCookie
