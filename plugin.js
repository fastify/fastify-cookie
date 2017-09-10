'use strict'

const fp = require('fastify-plugin')
const cookie = require('cookie')

function plugin (fastify, options, next) {
  fastify.addHook('preHandler', (fastifyReq, fastifyRes, done) => {
    if (fastifyReq.cookies) done()
    if (!fastifyReq.req.headers) fastifyReq.req.headers = {}

    const cookieHeader = fastifyReq.req.headers.cookie
    const cookies = (cookieHeader) ? cookie.parse(cookieHeader) : []
    fastifyReq.cookies = cookies

    fastifyRes.setCookie = function (name, value, options) {
      const seriaized = cookie.serialize(name, value, options || {})
      this.header('Set-Cookie', seriaized)
      return this
    }

    done()
  })

  next()
}

module.exports = fp(plugin, '>=0.15.0')
