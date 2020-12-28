'use strict'

const tap = require('tap')
const test = tap.test
const Fastify = require('fastify')
const sinon = require('sinon')
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

test('share options for setCookie and clearCookie', (t) => {
  t.plan(11)
  const fastify = Fastify()
  const secret = 'testsecret'
  fastify.register(plugin, { secret })

  const cookieOptions = {
    signed: true,
    maxAge: 36000
  }

  fastify.get('/test1', (req, reply) => {
    reply
      .setCookie('foo', 'foo', cookieOptions)
      .clearCookie('foo', cookieOptions)
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
    t.is(cookies.length, 2)
    t.is(cookies[0].name, 'foo')
    t.is(cookies[0].value, cookieSignature.sign('foo', secret))
    t.is(cookies[0].maxAge, 36000)

    t.is(cookies[1].name, 'foo')
    t.is(cookies[1].value, '')
    t.is(cookies[1].path, '/')
    t.ok(new Date(cookies[1].expires) < new Date())
  })
})

test('expires should not be overridden in clearCookie', (t) => {
  t.plan(11)
  const fastify = Fastify()
  const secret = 'testsecret'
  fastify.register(plugin, { secret })

  const cookieOptions = {
    signed: true,
    expires: Date.now() + 1000
  }

  fastify.get('/test1', (req, reply) => {
    reply
      .setCookie('foo', 'foo', cookieOptions)
      .clearCookie('foo', cookieOptions)
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
    t.is(cookies.length, 2)
    t.is(cookies[0].name, 'foo')
    t.is(cookies[0].value, cookieSignature.sign('foo', secret))
    const expires = new Date(cookies[0].expires)
    t.ok(expires < new Date(Date.now() + 5000))

    t.is(cookies[1].name, 'foo')
    t.is(cookies[1].value, '')
    t.is(cookies[1].path, '/')
    t.is(Number(cookies[1].expires), 0)
  })
})

test('parses incoming cookies', (t) => {
  t.plan(6 + 3 * 3)
  const fastify = Fastify()
  fastify.register(plugin)

  // check that it parses the cookies in the onRequest hook
  for (const hook of ['preValidation', 'preHandler']) {
    fastify.addHook(hook, (req, reply, done) => {
      t.ok(req.cookies)
      t.ok(req.cookies.bar)
      t.is(req.cookies.bar, 'bar')
      done()
    })
  }

  fastify.addHook('preParsing', (req, reply, payload, done) => {
    t.ok(req.cookies)
    t.ok(req.cookies.bar)
    t.is(req.cookies.bar, 'bar')
    done()
  })

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
  t.plan(8)

  t.test('unsign', t => {
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

  t.test('key rotation uses first key to sign', t => {
    t.plan(6)
    const fastify = Fastify()
    const secret1 = 'secret-1'
    const secret2 = 'secret-2'
    fastify.register(plugin, { secret: [secret1, secret2] })

    fastify.get('/test1', (req, reply) => {
      reply
        .setCookie('foo', 'cookieVal', { signed: true })
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
      t.is(cookieSignature.unsign(cookies[0].value, secret1), 'cookieVal') // decode using first key
    })
  })

  t.test('unsignCookie via request decorator', t => {
    t.plan(3)
    const fastify = Fastify()
    const secret = 'bar'
    fastify.register(plugin, { secret })

    fastify.get('/test1', (req, reply) => {
      reply.send({
        unsigned: req.unsignCookie(req.cookies.foo)
      })
    })

    fastify.inject({
      method: 'GET',
      url: '/test1',
      headers: {
        cookie: `foo=${cookieSignature.sign('foo', secret)}`
      }
    }, (err, res) => {
      t.error(err)
      t.strictEqual(res.statusCode, 200)
      t.deepEqual(JSON.parse(res.body), { unsigned: { value: 'foo', renew: false, valid: true } })
    })
  })

  t.test('unsignCookie via reply decorator', t => {
    t.plan(3)
    const fastify = Fastify()
    const secret = 'bar'
    fastify.register(plugin, { secret })

    fastify.get('/test1', (req, reply) => {
      reply.send({
        unsigned: reply.unsignCookie(req.cookies.foo)
      })
    })

    fastify.inject({
      method: 'GET',
      url: '/test1',
      headers: {
        cookie: `foo=${cookieSignature.sign('foo', secret)}`
      }
    }, (err, res) => {
      t.error(err)
      t.strictEqual(res.statusCode, 200)
      t.deepEqual(JSON.parse(res.body), { unsigned: { value: 'foo', renew: false, valid: true } })
    })
  })

  t.test('unsignCookie via request decorator after rotation', t => {
    t.plan(3)
    const fastify = Fastify()
    const secret1 = 'sec-1'
    const secret2 = 'sec-2'
    fastify.register(plugin, { secret: [secret1, secret2] })

    fastify.get('/test1', (req, reply) => {
      reply.send({
        unsigned: req.unsignCookie(req.cookies.foo)
      })
    })

    fastify.inject({
      method: 'GET',
      url: '/test1',
      headers: {
        cookie: `foo=${cookieSignature.sign('foo', secret2)}`
      }
    }, (err, res) => {
      t.error(err)
      t.strictEqual(res.statusCode, 200)
      t.deepEqual(JSON.parse(res.body), { unsigned: { value: 'foo', renew: true, valid: true } })
    })
  })

  t.test('unsignCookie via reply decorator after rotation', t => {
    t.plan(3)
    const fastify = Fastify()
    const secret1 = 'sec-1'
    const secret2 = 'sec-2'
    fastify.register(plugin, { secret: [secret1, secret2] })

    fastify.get('/test1', (req, reply) => {
      reply.send({
        unsigned: reply.unsignCookie(req.cookies.foo)
      })
    })

    fastify.inject({
      method: 'GET',
      url: '/test1',
      headers: {
        cookie: `foo=${cookieSignature.sign('foo', secret2)}`
      }
    }, (err, res) => {
      t.error(err)
      t.strictEqual(res.statusCode, 200)
      t.deepEqual(JSON.parse(res.body), { unsigned: { value: 'foo', renew: true, valid: true } })
    })
  })

  t.test('unsignCookie via request decorator failure response', t => {
    t.plan(3)
    const fastify = Fastify()
    const secret1 = 'sec-1'
    const secret2 = 'sec-2'
    fastify.register(plugin, { secret: [secret1, secret2] })

    fastify.get('/test1', (req, reply) => {
      reply.send({
        unsigned: req.unsignCookie(req.cookies.foo)
      })
    })

    fastify.inject({
      method: 'GET',
      url: '/test1',
      headers: {
        cookie: `foo=${cookieSignature.sign('foo', 'invalid-secret')}`
      }
    }, (err, res) => {
      t.error(err)
      t.strictEqual(res.statusCode, 200)
      t.deepEqual(JSON.parse(res.body), { unsigned: { value: null, renew: false, valid: false } })
    })
  })

  t.test('unsignCookie reply decorator failure response', t => {
    t.plan(3)
    const fastify = Fastify()
    const secret1 = 'sec-1'
    const secret2 = 'sec-2'
    fastify.register(plugin, { secret: [secret1, secret2] })

    fastify.get('/test1', (req, reply) => {
      reply.send({
        unsigned: reply.unsignCookie(req.cookies.foo)
      })
    })

    fastify.inject({
      method: 'GET',
      url: '/test1',
      headers: {
        cookie: `foo=${cookieSignature.sign('foo', 'invalid-secret')}`
      }
    }, (err, res) => {
      t.error(err)
      t.strictEqual(res.statusCode, 200)
      t.deepEqual(JSON.parse(res.body), { unsigned: { value: null, renew: false, valid: false } })
    })
  })
})

test('custom signer', t => {
  t.plan(7)
  const fastify = Fastify()
  const signStub = sinon.stub().returns('SIGNED-VALUE')
  const unsignStub = sinon.stub().returns('ORIGINAL VALUE')
  const secret = { sign: signStub, unsign: unsignStub }
  fastify.register(plugin, { secret })

  fastify.get('/test1', (req, reply) => {
    reply
      .setCookie('foo', 'bar', { signed: true })
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
    t.is(cookies[0].value, 'SIGNED-VALUE')
    t.ok(signStub.calledOnceWithExactly('bar'))
  })
})

test('unsignCookie decorator with custom signer', t => {
  t.plan(4)
  const fastify = Fastify()
  const signStub = sinon.stub().returns('SIGNED-VALUE')
  const unsignStub = sinon.stub().returns('ORIGINAL VALUE')
  const secret = { sign: signStub, unsign: unsignStub }
  fastify.register(plugin, { secret })

  fastify.get('/test1', (req, reply) => {
    reply.send({
      unsigned: reply.unsignCookie(req.cookies.foo)
    })
  })

  fastify.inject({
    method: 'GET',
    url: '/test1',
    headers: {
      cookie: 'foo=SOME-SIGNED-VALUE'
    }
  }, (err, res) => {
    t.error(err)
    t.strictEqual(res.statusCode, 200)
    t.deepEqual(JSON.parse(res.body), { unsigned: 'ORIGINAL VALUE' })
    t.ok(unsignStub.calledOnceWithExactly('SOME-SIGNED-VALUE'))
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

test('parse cookie manually using decorator', (t) => {
  t.plan(2)
  const fastify = Fastify()
  fastify.register(plugin)

  fastify.ready(() => {
    t.ok(fastify.parseCookie)
    t.deepEqual(fastify.parseCookie('foo=bar', {}), { foo: 'bar' })
    t.end()
  })
})
