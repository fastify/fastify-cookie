
'use strict'

const tap = require('tap')
const test = tap.test
const Fastify = require('fastify')
const request = require('request')
const plugin = require('../')

test('cookies get set correctly', (t) => {
  t.plan(7)
  const fastify = Fastify()
  fastify.register(plugin)

  fastify.get('/test1', (req, reply) => {
    reply
      .setCookie('foo', 'foo', {path: '/'})
      .send({hello: 'world'})
  })

  fastify.listen(0, (err) => {
    if (err) tap.error(err)
    fastify.server.unref()

    const reqOpts = {
      method: 'GET',
      baseUrl: 'http://localhost:' + fastify.server.address().port
    }
    const req = request.defaults(reqOpts)

    const jar = request.jar()
    req({uri: '/test1', jar}, (err, response, body) => {
      t.error(err)
      t.strictEqual(response.statusCode, 200)
      t.deepEqual(JSON.parse(body), {hello: 'world'})

      const cookies = jar.getCookies(reqOpts.baseUrl + '/test1')
      t.is(cookies.length, 1)
      t.is(cookies[0].key, 'foo')
      t.is(cookies[0].value, 'foo')
      t.is(cookies[0].path, '/')
    })
  })
})

test('should set multiple cookies', (t) => {
  t.plan(8)
  const fastify = Fastify()
  fastify.register(plugin)

  fastify.get('/', (req, reply) => {
    reply
      .setCookie('foo', 'foo')
      .setCookie('bar', 'test')
      .send({hello: 'world'})
  })

  fastify.listen(0, (err) => {
    if (err) tap.error(err)
    fastify.server.unref()

    const reqOpts = {
      method: 'GET',
      baseUrl: 'http://localhost:' + fastify.server.address().port
    }
    const req = request.defaults(reqOpts)

    const jar = request.jar()
    req({uri: '/', jar}, (err, response, body) => {
      t.error(err)
      t.strictEqual(response.statusCode, 200)
      t.deepEqual(JSON.parse(body), {hello: 'world'})

      const cookies = jar.getCookies(reqOpts.baseUrl + '/')
      t.is(cookies.length, 2)
      t.is(cookies[0].key, 'foo')
      t.is(cookies[0].value, 'foo')
      t.is(cookies[1].key, 'bar')
      t.is(cookies[1].value, 'test')
    })
  })
})

test('cookies get set correctly with millisecond dates', (t) => {
  t.plan(8)
  const fastify = Fastify()
  fastify.register(plugin)

  fastify.get('/test1', (req, reply) => {
    reply
      .setCookie('foo', 'foo', {path: '/', expires: Date.now() + 1000})
      .send({hello: 'world'})
  })

  fastify.listen(0, (err) => {
    if (err) tap.error(err)
    fastify.server.unref()

    const reqOpts = {
      method: 'GET',
      baseUrl: 'http://localhost:' + fastify.server.address().port
    }
    const req = request.defaults(reqOpts)

    const jar = request.jar()
    req({uri: '/test1', jar}, (err, response, body) => {
      t.error(err)
      t.strictEqual(response.statusCode, 200)
      t.deepEqual(JSON.parse(body), {hello: 'world'})

      const cookies = jar.getCookies(reqOpts.baseUrl + '/test1')
      t.is(cookies.length, 1)
      t.is(cookies[0].key, 'foo')
      t.is(cookies[0].value, 'foo')
      t.is(cookies[0].path, '/')
      const expires = new Date(cookies[0].expires)
      t.ok(expires < new Date(Date.now() + 5000))
    })
  })
})

test('parses incoming cookies', (t) => {
  t.plan(6)
  const fastify = Fastify()
  fastify.register(plugin)

  fastify.get('/test2', (req, reply) => {
    t.ok(req.cookies)
    t.ok(req.cookies.bar)
    t.is(req.cookies.bar, 'bar')
    reply.send({hello: 'world'})
  })

  fastify.listen(0, (err) => {
    if (err) tap.error(err)
    fastify.server.unref()

    const reqOpts = {
      method: 'GET',
      baseUrl: 'http://localhost:' + fastify.server.address().port
    }
    const req = request.defaults(reqOpts)

    const headers = {
      cookie: 'bar=bar'
    }
    req({uri: '/test2', headers}, (err, response, body) => {
      t.error(err)
      t.strictEqual(response.statusCode, 200)
      t.deepEqual(JSON.parse(body), {hello: 'world'})
    })
  })
})

test('does not modify supplied cookie options object', (t) => {
  t.plan(3)
  const expireDate = Date.now() + 1000
  const cookieOptions = {
    path: '/',
    expires: expireDate
  }
  const fastify = Fastify()
  fastify.register(plugin)

  fastify.get('/test1', (req, reply) => {
    reply
      .setCookie('foo', 'foo', cookieOptions)
      .send({hello: 'world'})
  })

  fastify.listen(0, (err) => {
    if (err) tap.error(err)
    fastify.server.unref()

    const reqOpts = {
      method: 'GET',
      baseUrl: 'http://localhost:' + fastify.server.address().port
    }
    const req = request.defaults(reqOpts)

    const jar = request.jar()
    req({uri: '/test1', jar}, (err, response, body) => {
      t.error(err)
      t.strictEqual(response.statusCode, 200)
      t.strictDeepEqual(cookieOptions, {
        path: '/',
        expires: expireDate
      })
    })
  })
})
