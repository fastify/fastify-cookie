'use strict'

const fp = require('fastify-plugin')
const cookie = require('cookie')

const { Signer, sign, unsign } = require('./signer')

function fastifyCookieSetCookie (reply, name, value, options, signer) {
  const opts = Object.assign({}, options)
  if (opts.expires && Number.isInteger(opts.expires)) {
    opts.expires = new Date(opts.expires)
  }

  if (opts.signed) {
    value = signer.sign(value)
  }

  if (opts.secure === 'auto') {
    if (isConnectionSecure(reply.request)) {
      opts.secure = true
    } else {
      opts.sameSite = 'lax'
      opts.secure = false
    }
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
  const opts = Object.assign({ path: '/' }, options, {
    expires: new Date(1),
    signed: undefined,
    maxAge: undefined
  })
  return fastifyCookieSetCookie(reply, name, '', opts)
}

function onReqHandlerWrapper (fastify, hook) {
  return hook === 'preParsing'
    ? function fastifyCookieHandler (fastifyReq, fastifyRes, payload, done) {
      fastifyReq.cookies = {} // New container per request. Issue #53
      const cookieHeader = fastifyReq.raw.headers.cookie
      if (cookieHeader) {
        fastifyReq.cookies = fastify.parseCookie(cookieHeader)
      }
      done()
    }
    : function fastifyCookieHandler (fastifyReq, fastifyRes, done) {
      fastifyReq.cookies = {} // New container per request. Issue #53
      const cookieHeader = fastifyReq.raw.headers.cookie
      if (cookieHeader) {
        fastifyReq.cookies = fastify.parseCookie(cookieHeader)
      }
      done()
    }
}

function getHook (hook = 'onRequest') {
  const hooks = {
    onRequest: 'onRequest',
    preParsing: 'preParsing',
    preValidation: 'preValidation',
    preHandler: 'preHandler',
    [false]: false
  }

  return hooks[hook]
}

function plugin (fastify, options, next) {
  const secret = options.secret
  const hook = getHook(options.hook)
  if (hook === undefined) {
    return next(new Error('@fastify/cookie: Invalid value provided for the hook-option. You can set the hook-option only to false, \'onRequest\' , \'preParsing\' , \'preValidation\' or \'preHandler\''))
  }
  const isSigner = !secret || (typeof secret.sign === 'function' && typeof secret.unsign === 'function')
  const algorithm = options.algorithm || 'sha256'
  const signer = isSigner ? secret : new Signer(secret, algorithm)

  fastify.decorate('parseCookie', parseCookie)

  if (typeof secret !== 'undefined') {
    fastify.decorate('signCookie', signCookie)
    fastify.decorate('unsignCookie', unsignCookie)

    fastify.decorateRequest('signCookie', signCookie)
    fastify.decorateRequest('unsignCookie', unsignCookie)

    fastify.decorateReply('signCookie', signCookie)
    fastify.decorateReply('unsignCookie', unsignCookie)
  }

  fastify.decorateRequest('cookies', null)
  fastify.decorateReply('cookie', setCookie)

  fastify.decorateReply('setCookie', setCookie)
  fastify.decorateReply('clearCookie', clearCookie)

  if (hook) {
    fastify.addHook(hook, onReqHandlerWrapper(fastify, hook))
  }

  next()

  // ***************************
  function parseCookie (cookieHeader) {
    return cookie.parse(cookieHeader, options.parseOptions)
  }

  function signCookie (value) {
    return signer.sign(value)
  }

  function unsignCookie (value) {
    return signer.unsign(value)
  }

  function setCookie (name, value, cookieOptions) {
    const opts = Object.assign({}, options.parseOptions, cookieOptions)
    return fastifyCookieSetCookie(this, name, value, opts, signer)
  }

  function clearCookie (name, cookieOptions) {
    const opts = Object.assign({}, options.parseOptions, cookieOptions)
    return fastifyCookieClearCookie(this, name, opts)
  }
}

function isConnectionSecure (request) {
  return (
    request.raw.socket?.encrypted === true ||
    request.headers['x-forwarded-proto'] === 'https'
  )
}

const fastifyCookie = fp(plugin, {
  fastify: '4.x',
  name: '@fastify/cookie'
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
fastifyCookie.signerFactory = Signer
fastifyCookie.fastifyCookie = fastifyCookie
fastifyCookie.default = fastifyCookie
module.exports = fastifyCookie

fastifyCookie.fastifyCookie.signerFactory = Signer
fastifyCookie.fastifyCookie.Signer = Signer
fastifyCookie.fastifyCookie.sign = sign
fastifyCookie.fastifyCookie.unsign = unsign

module.exports.signerFactory = Signer
module.exports.Signer = Signer
module.exports.sign = sign
module.exports.unsign = unsign
