'use strict'

const tap = require('tap')
const test = tap.test
const Fastify = require('fastify')
const cookieSignature = require('cookie-signature')
const plugin = require('../')

test('cookies get set correctly', (t) => {
  t.plan(7)
  const fastify = Fastify()
  fastify.register(plugin)

  fastify.get('/test1', (req, reply) => {
    reply
      .setCookie('foo', 'foo', { path: '/' })
      .send({ hello: 'world' })
  })

  fastify.inject({
    method: 'GET',
    url: '/test1'
  }, (err, res) => {
    t.error(err)
    t.strictEqual(res.statusCode, 200)
    t.deepEqual(JSON.parse(res.body), { hello: 'world' })

    const cookies = res.cookies
    t.is(cookies.length, 1)
    t.is(cookies[0].name, 'foo')
    t.is(cookies[0].value, 'foo')
    t.is(cookies[0].path, '/')
  })
})

test('should set multiple cookies', (t) => {
  t.plan(10)
  const fastify = Fastify()
  fastify.register(plugin)

  fastify.get('/', (req, reply) => {
    reply
      .setCookie('foo', 'foo')
      .setCookie('bar', 'test')
      .setCookie('wee', 'woo')
      .send({ hello: 'world' })
  })

  fastify.inject({
    method: 'GET',
    url: '/'
  }, (err, res) => {
    t.error(err)
    t.strictEqual(res.statusCode, 200)
    t.deepEqual(JSON.parse(res.body), { hello: 'world' })

    const cookies = res.cookies
    t.is(cookies.length, 3)
    t.is(cookies[0].name, 'foo')
    t.is(cookies[0].value, 'foo')
    t.is(cookies[1].name, 'bar')
    t.is(cookies[1].value, 'test')
    t.is(cookies[2].name, 'wee')
    t.is(cookies[2].value, 'woo')
  })
})

test('cookies get set correctly with millisecond dates', (t) => {
  t.plan(8)
  const fastify = Fastify()
  fastify.register(plugin)

  fastify.get('/test1', (req, reply) => {
    reply
      .setCookie('foo', 'foo', { path: '/', expires: Date.now() + 1000 })
      .send({ hello: 'world' })
  })

  fastify.inject({
    method: 'GET',
    url: '/test1'
  }, (err, res) => {
    t.error(err)
    t.strictEqual(res.statusCode, 200)
    t.deepEqual(JSON.parse(res.body), { hello: 'world' })

    const cookies = res.cookies
    t.is(cookies.length, 1)
    t.is(cookies[0].name, 'foo')
    t.is(cookies[0].value, 'foo')
    t.is(cookies[0].path, '/')
    const expires = new Date(cookies[0].expires)
    t.ok(expires < new Date(Date.now() + 5000))
  })
})

test('parses incoming cookies', (t) => {
  t.plan(6 + 3 * 3)
  const fastify = Fastify()
  fastify.register(plugin)

  // check that it parses the cookies in the onRequest hook
  for (const hook of ['preParsing', 'preValidation', 'preHandler']) {
    fastify.addHook(hook, (req, reply, done) => {
      t.ok(req.cookies)
      t.ok(req.cookies.bar)
      t.is(req.cookies.bar, 'bar')
      done()
    })
  }

  fastify.get('/test2', (req, reply) => {
    t.ok(req.cookies)
    t.ok(req.cookies.bar)
    t.is(req.cookies.bar, 'bar')
    reply.send({ hello: 'world' })
  })

  fastify.inject({
    method: 'GET',
    url: '/test2',
    headers: {
      cookie: 'bar=bar'
    }
  }, (err, res) => {
    t.error(err)
    t.strictEqual(res.statusCode, 200)
    t.deepEqual(JSON.parse(res.body), { hello: 'world' })
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
      .send({ hello: 'world' })
  })

  fastify.inject({
    method: 'GET',
    url: '/test1'
  }, (err, res) => {
    t.error(err)
    t.strictEqual(res.statusCode, 200)
    t.strictDeepEqual(cookieOptions, {
      path: '/',
      expires: expireDate
    })
  })
})

test('cookies gets cleared correctly', (t) => {
  t.plan(5)
  const fastify = Fastify()
  fastify.register(plugin)

  fastify.get('/test1', (req, reply) => {
    reply
      .clearCookie('foo')
      .send({ hello: 'world' })
  })

  fastify.inject({
    method: 'GET',
    url: '/test1'
  }, (err, res) => {
    t.error(err)
    t.strictEqual(res.statusCode, 200)
    t.deepEqual(JSON.parse(res.body), { hello: 'world' })

    const cookies = res.cookies
    t.is(cookies.length, 1)
    t.is(new Date(cookies[0].expires) < new Date(), true)
  })
})

test('cookies signature', (t) => {
  t.plan(6)
  const fastify = Fastify()
  const secret = 'bar'
  fastify.register(plugin, { secret })

  fastify.get('/test1', (req, reply) => {
    reply
      .setCookie('foo', 'foo', { signed: true })
      .send({ hello: 'world' })
  })

  fastify.inject({
    method: 'GET',
    url: '/test1'
  }, (err, res) => {
    t.error(err)
    t.strictEqual(res.statusCode, 200)
    t.deepEqual(JSON.parse(res.body), { hello: 'world' })

    const cookies = res.cookies
    t.is(cookies.length, 1)
    t.is(cookies[0].name, 'foo')
    t.is(cookieSignature.unsign(cookies[0].value, secret), 'foo')
  })
})

test('pass options to `cookies.parse`', (t) => {
  t.plan(6)
  const fastify = Fastify()
  fastify.register(plugin, {
    parseOptions: {
      decode: decoder
    }
  })

  fastify.get('/test1', (req, reply) => {
    t.ok(req.cookies)
    t.ok(req.cookies.foo)
    t.is(req.cookies.foo, 'bartest')
    reply.send({ hello: 'world' })
  })

  fastify.inject({
    method: 'GET',
    url: '/test1',
    headers: {
      cookie: 'foo=bar'
    }
  }, (err, res) => {
    t.error(err)
    t.strictEqual(res.statusCode, 200)
    t.deepEqual(JSON.parse(res.body), { hello: 'world' })
  })

  function decoder (str) {
    return str + 'test'
  }
})

test('issue 53', (t) => {
  t.plan(5)
  const fastify = Fastify()
  fastify.register(plugin)

  let cookies
  let count = 1
  fastify.get('/foo', (req, reply) => {
    if (count > 1) {
      t.notEqual(cookies, req.cookies)
      return reply.send('done')
    }

    count += 1
    cookies = req.cookies
    reply.send('done')
  })

  fastify.inject({ url: '/foo' }, (err, response) => {
    t.error(err)
    t.is(response.body, 'done')
  })

  fastify.inject({ url: '/foo' }, (err, response) => {
    t.error(err)
    t.is(response.body, 'done')
  })
})
