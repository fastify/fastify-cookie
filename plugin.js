'use strict'

const fp = require('fastify-plugin')
const cookie = require('./cookie')

const signerFactory = require('./signer')

function fastifyCookieSetCookie (reply, name, value, options, signer) {
  const opts = Object.assign({}, options)
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

  fastify.decorate('parseCookie', parseCookie)
  fastify.decorate('unsignCookie', unsignCookie)

  fastify.decorateRequest('cookies', null)
  fastify.decorateRequest('unsignCookie', unsignCookie)
  fastify.decorateReply('setCookie', setCookie)
  fastify.decorateReply('cookie', setCookie)
  fastify.decorateReply('clearCookie', clearCookie)
  fastify.decorateReply('unsignCookie', unsignCookie)

  fastify.addHook('onRequest', onReqHandlerWrapper(fastify))

  next()

  // ***************************
  function parseCookie (cookieHeader) {
    return cookie.parse(cookieHeader, options.parseOptions)
  }

  function unsignCookie (value) {
    return signer.unsign(value)
  }

  function setCookie (name, value, cookieOptions) {
    const opts = Object.assign({}, options.parseOptions, cookieOptions)
    return fastifyCookieSetCookie(this, name, value, opts, signer)
  }

  function clearCookie (name, options) {
    return fastifyCookieClearCookie(this, name, options)
  }
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
