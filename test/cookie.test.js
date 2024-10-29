'use strict'

const { describe, test } = require('node:test')
const assert = require('node:assert/strict')
const Fastify = require('fastify')
const sinon = require('sinon')
const { sign, unsign } = require('../signer')
const plugin = require('../')

test('cookies get set correctly', (t) => {
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
  }).then(res => {
    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.body), { hello: 'world' })

    const cookies = res.cookies
    assert.strictEqual(cookies.length, 1)
    assert.strictEqual(cookies[0].name, 'foo')
    assert.strictEqual(cookies[0].value, 'foo')
    assert.strictEqual(cookies[0].path, '/')
  }).catch(err => {
    assert.fail(err)
  })
})

test('express cookie compatibility', (t) => {
  const fastify = Fastify()
  fastify.register(plugin)

  fastify.get('/espresso', (req, reply) => {
    reply
      .cookie('foo', 'foo', { path: '/' })
      .send({ hello: 'world' })
  })

  fastify.inject({
    method: 'GET',
    url: '/espresso'
  }).then(res => {
    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.body), { hello: 'world' })

    const cookies = res.cookies
    assert.strictEqual(cookies.length, 1)
    assert.strictEqual(cookies[0].name, 'foo')
    assert.strictEqual(cookies[0].value, 'foo')
    assert.strictEqual(cookies[0].path, '/')
  }).catch(err => {
    assert.fail(err)
  })
})

test('should set multiple cookies', (t) => {
  const fastify = Fastify()
  fastify.register(plugin)

  fastify.get('/', (req, reply) => {
    reply
      .setCookie('foo', 'foo')
      .cookie('bar', 'test')
      .setCookie('wee', 'woo')
      .send({ hello: 'world' })
  })

  fastify.inject({
    method: 'GET',
    url: '/'
  }).then(res => {
    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.body), { hello: 'world' })

    const cookies = res.cookies
    assert.strictEqual(cookies.length, 3)
    assert.strictEqual(cookies[0].name, 'foo')
    assert.strictEqual(cookies[0].value, 'foo')
    assert.strictEqual(cookies[1].name, 'bar')
    assert.strictEqual(cookies[1].value, 'test')
    assert.strictEqual(cookies[2].name, 'wee')
    assert.strictEqual(cookies[2].value, 'woo')
  }).catch(err => {
    assert.fail(err)
  })
})

test('should set multiple cookies', (t) => {
  const fastify = Fastify()
  fastify.register(plugin)

  fastify.get('/', (req, reply) => {
    reply
      .setCookie('foo', 'foo')
      .cookie('bar', 'test', {
        partitioned: true
      })
      .setCookie('wee', 'woo', {
        partitioned: true,
        secure: true
      })
      .send({ hello: 'world' })
  })

  fastify.inject({
    method: 'GET',
    url: '/'
  }).then(res => {
    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.body), { hello: 'world' })

    const cookies = res.cookies
    assert.strictEqual(cookies.length, 3)
    assert.strictEqual(cookies[0].name, 'foo')
    assert.strictEqual(cookies[0].value, 'foo')
    assert.strictEqual(cookies[1].name, 'bar')
    assert.strictEqual(cookies[1].value, 'test')
    assert.strictEqual(cookies[2].name, 'wee')
    assert.strictEqual(cookies[2].value, 'woo')

    assert.strictEqual(res.headers['set-cookie'][1], 'bar=test; Partitioned; SameSite=Lax')
    assert.strictEqual(res.headers['set-cookie'][2], 'wee=woo; Secure; Partitioned; SameSite=Lax')
  }).catch(err => {
    assert.fail(err)
  })
})

test('should set multiple cookies (an array already exists)', (t) => {
  const fastify = Fastify()
  fastify.register(plugin)

  fastify.get('/test1', (req, reply) => {
    reply
      .header('Set-Cookie', ['bar=bar'])
      .setCookie('foo', 'foo', { path: '/' })
      .setCookie('foo', 'foo', { path: '/path' })
      .send({ hello: 'world' })
  })

  fastify.inject({
    method: 'GET',
    url: '/test1'
  }).then(res => {
    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.body), { hello: 'world' })

    const cookies = res.cookies
    assert.strictEqual(cookies.length, 3)
    assert.strictEqual(cookies[0].name, 'bar')
    assert.strictEqual(cookies[0].value, 'bar')
    assert.strictEqual(cookies[0].path, undefined)

    assert.strictEqual(cookies[1].name, 'foo')
    assert.strictEqual(cookies[1].value, 'foo')
    assert.strictEqual(cookies[2].path, '/path')
  }).catch(err => {
    assert.fail(err)
  })
})

test('cookies get set correctly with millisecond dates', (t) => {
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
  }).then(res => {
    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.body), { hello: 'world' })

    const cookies = res.cookies
    assert.strictEqual(cookies.length, 1)
    assert.strictEqual(cookies[0].name, 'foo')
    assert.strictEqual(cookies[0].value, 'foo')
    assert.strictEqual(cookies[0].path, '/')
    const expires = new Date(cookies[0].expires)
    assert.ok(expires < new Date(Date.now() + 5000))
  }).catch(err => {
    assert.fail(err)
  })
})

test('share options for setCookie and clearCookie', (t) => {
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
  }).then((res) => {
    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.body), { hello: 'world' })

    const cookies = res.cookies
    assert.strictEqual(cookies.length, 1)
    assert.strictEqual(cookies[0].name, 'foo')
    assert.strictEqual(cookies[0].value, '')
    assert.strictEqual(cookies[0].maxAge, 0)

    assert.ok(new Date(cookies[0].expires) < new Date())
  }).catch(err => {
    assert.fail(err)
  })
})

test('expires should not be overridden in clearCookie', (t) => {
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
  }).then((res) => {
    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.body), { hello: 'world' })

    const cookies = res.cookies
    assert.strictEqual(cookies.length, 1)
    assert.strictEqual(cookies[0].name, 'foo')
    assert.strictEqual(cookies[0].value, '')
    const expires = new Date(cookies[0].expires)
    assert.ok(expires < new Date(Date.now() + 5000))
  })
})

test('parses incoming cookies', (t) => {
  const fastify = Fastify()
  fastify.register(plugin)

  // check that it parses the cookies in the onRequest hook
  for (const hook of ['preValidation', 'preHandler']) {
    fastify.addHook(hook, (req, reply, done) => {
      assert.ok(req.cookies)
      assert.ok(req.cookies.bar)
      assert.strictEqual(req.cookies.bar, 'bar')
      done()
    })
  }

  fastify.addHook('preParsing', (req, reply, payload, done) => {
    assert.ok(req.cookies)
    assert.ok(req.cookies.bar)
    assert.strictEqual(req.cookies.bar, 'bar')
    done()
  })

  fastify.get('/test2', (req, reply) => {
    assert.ok(req.cookies)
    assert.ok(req.cookies.bar)
    assert.strictEqual(req.cookies.bar, 'bar')
    reply.send({ hello: 'world' })
  })

  fastify.inject({
    method: 'GET',
    url: '/test2',
    headers: {
      cookie: 'bar=bar'
    }
  }).then((res) => {
    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.body), { hello: 'world' })
  }).catch(err => {
    assert.fail(err)
  })
})

test('defined and undefined cookies', (t) => {
  const fastify = Fastify()
  fastify.register(plugin)

  // check that it parses the cookies in the onRequest hook
  for (const hook of ['preValidation', 'preHandler']) {
    fastify.addHook(hook, (req, reply, done) => {
      assert.ok(req.cookies)

      assert.ok(req.cookies.bar)
      assert.ok(!req.cookies.baz)

      assert.strictEqual(req.cookies.bar, 'bar')
      assert.strictEqual(req.cookies.baz, undefined)
    })
  }

  fastify.addHook('preParsing', (req, reply, payload, done) => {
    assert.ok(req.cookies)

    assert.ok(req.cookies.bar)
    assert.ok(!req.cookies.baz)

    assert.strictEqual(req.cookies.bar, 'bar')
    assert.strictEqual(req.cookies.baz, undefined)
  })

  fastify.get('/test2', (req, reply) => {
    assert.ok(req.cookies)

    assert.ok(req.cookies.bar)
    assert.ok(!req.cookies.baz)

    assert.strictEqual(req.cookies.bar, 'bar')
    assert.strictEqual(req.cookies.baz, undefined)

    reply.send({ hello: 'world' })
  })

  fastify.inject({
    method: 'GET',
    url: '/test2',
    headers: {
      cookie: 'bar=bar'
    }
  }).then((res) => {
    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.body), { hello: 'world' })
  }).catch(err => {
    assert.fail(err)
  })
})

test('does not modify supplied cookie options object', (t) => {
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
  }).then(res => {
    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(cookieOptions, {
      path: '/',
      expires: expireDate
    })
  }).catch(err => {
    assert.fail(err)
  })
})

test('cookies gets cleared correctly', (t) => {
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
  }).then((res) => {
    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.body), { hello: 'world' })

    const cookies = res.cookies
    assert.strictEqual(cookies.length, 1)
    assert.strictEqual(new Date(cookies[0].expires) < new Date(), true)
  }).catch(err => {
    assert.fail(err)
  })
})

describe('cookies signature', () => {
  test('unsign', t => {
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
    }).then((res) => {
      assert.strictEqual(res.statusCode, 200)
      assert.deepStrictEqual(JSON.parse(res.body), { hello: 'world' })

      const cookies = res.cookies
      assert.strictEqual(cookies.length, 1)
      assert.strictEqual(cookies[0].name, 'foo')
      assert.deepStrictEqual(unsign(cookies[0].value, secret), { valid: true, renew: false, value: 'foo' })
    }).catch(err => {
      assert.fail(err)
    })
  })

  test('key rotation uses first key to sign', t => {
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
    }).then((res) => {
      assert.strictEqual(res.statusCode, 200)
      assert.deepStrictEqual(JSON.parse(res.body), { hello: 'world' })

      const cookies = res.cookies
      assert.strictEqual(cookies.length, 1)
      assert.strictEqual(cookies[0].name, 'foo')
      assert.deepStrictEqual(unsign(cookies[0].value, secret1), { valid: true, renew: false, value: 'cookieVal' }) // decode using first key
    }).catch(err => {
      assert.fail(err)
    })
  })

  test('unsginCookie via fastify instance', t => {
    const fastify = Fastify()
    const secret = 'bar'

    fastify.register(plugin, { secret })

    fastify.get('/test1', (req, rep) => {
      rep.send({
        unsigned: fastify.unsignCookie(req.cookies.foo)
      })
    })

    fastify.inject({
      method: 'GET',
      url: '/test1',
      headers: {
        cookie: `foo=${sign('foo', secret)}`
      }
    }).then((res) => {
      assert.strictEqual(res.statusCode, 200)
      assert.deepStrictEqual(JSON.parse(res.body), { unsigned: { value: 'foo', renew: false, valid: true } })
    }).catch(err => {
      assert.fail(err)
    })
  })

  test('unsignCookie via request decorator', t => {
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
        cookie: `foo=${sign('foo', secret)}`
      }
    }).then((res) => {
      assert.strictEqual(res.statusCode, 200)
      assert.deepStrictEqual(JSON.parse(res.body), { unsigned: { value: 'foo', renew: false, valid: true } })
    }).catch(err => {
      assert.fail(err)
    })
  })

  test('unsignCookie via reply decorator', t => {
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
        cookie: `foo=${sign('foo', secret)}`
      }
    }).then((res) => {
      assert.strictEqual(res.statusCode, 200)
      assert.deepStrictEqual(JSON.parse(res.body), { unsigned: { value: 'foo', renew: false, valid: true } })
    }).catch(err => {
      assert.fail(err)
    })
  })

  test('unsignCookie via request decorator after rotation', t => {
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
        cookie: `foo=${sign('foo', secret2)}`
      }
    }).then((res) => {
      assert.strictEqual(res.statusCode, 200)
      assert.deepStrictEqual(JSON.parse(res.body), { unsigned: { value: 'foo', renew: true, valid: true } })
    }).catch(err => {
      assert.fail(err)
    })
  })

  test('unsignCookie via reply decorator after rotation', t => {
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
        cookie: `foo=${sign('foo', secret2)}`
      }
    }).then((res) => {
      assert.strictEqual(res.statusCode, 200)
      assert.deepStrictEqual(JSON.parse(res.body), { unsigned: { value: 'foo', renew: true, valid: true } })
    }).catch(err => {
      assert.fail(err)
    })
  })

  test('unsignCookie via request decorator failure response', t => {
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
        cookie: `foo=${sign('foo', 'invalid-secret')}`
      }
    }).then((res) => {
      assert.strictEqual(res.statusCode, 200)
      assert.deepStrictEqual(JSON.parse(res.body), { unsigned: { value: null, renew: false, valid: false } })
    }).catch(err => {
      assert.fail(err)
    })
  })

  test('unsignCookie reply decorator failure response', t => {
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
        cookie: `foo=${sign('foo', 'invalid-secret')}`
      }
    }).then((res) => {
      assert.strictEqual(res.statusCode, 200)
      assert.deepStrictEqual(JSON.parse(res.body), { unsigned: { value: null, renew: false, valid: false } })
    }).catch(err => {
      assert.fail(err)
    })
  })
})

test('custom signer', t => {
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
  }).then((res) => {
    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.body), { hello: 'world' })

    const cookies = res.cookies
    assert.strictEqual(cookies.length, 1)
    assert.strictEqual(cookies[0].name, 'foo')
    assert.strictEqual(cookies[0].value, 'SIGNED-VALUE')
    assert.ok(signStub.calledOnceWithExactly('bar'))
  }).catch(err => {
    assert.fail(err)
  })
})

test('unsignCookie decorator with custom signer', t => {
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
  }).then((res) => {
    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.body), { unsigned: 'ORIGINAL VALUE' })
    assert.ok(unsignStub.calledOnceWithExactly('SOME-SIGNED-VALUE'))
  }).catch(err => {
    assert.fail(err)
  })
})

test('pass options to `cookies.parse`', (t) => {
  const fastify = Fastify()
  fastify.register(plugin, {
    parseOptions: {
      decode: decoder
    }
  })

  fastify.get('/test1', (req, reply) => {
    assert.ok(req.cookies)
    assert.ok(req.cookies.foo)
    assert.strictEqual(req.cookies.foo, 'bartest')
    reply.send({ hello: 'world' })
  })

  fastify.inject({
    method: 'GET',
    url: '/test1',
    headers: {
      cookie: 'foo=bar'
    }
  }).then((res) => {
    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.body), { hello: 'world' })
  }).catch(err => {
    assert.fail(err)
  })

  function decoder (str) {
    return str + 'test'
  }
})

test('issue 53', (t) => {
  const fastify = Fastify()
  fastify.register(plugin)

  let cookies
  let count = 1
  fastify.get('/foo', (req, reply) => {
    if (count > 1) {
      assert.notEqual(cookies, req.cookies)
      return reply.send('done')
    }

    count += 1
    cookies = req.cookies
    reply.send('done')
  })

  fastify.inject({ url: '/foo' }).then((res) => {
    assert.strictEqual(res.body, 'done')
  }).catch(err => {
    assert.fail(err)
  })

  fastify.inject({ url: '/foo' }).then((res) => {
    assert.strictEqual(res.body, 'done')
  }).catch(err => {
    assert.fail(err)
  })
})

test('serialize cookie manually using decorator', (t) => {
  const fastify = Fastify()
  fastify.register(plugin)

  fastify.ready(() => {
    assert.ok(fastify.serializeCookie)
    assert.deepStrictEqual(fastify.serializeCookie('foo', 'bar', {}), 'foo=bar')
  })
})

test('parse cookie manually using decorator', (t) => {
  const fastify = Fastify()
  fastify.register(plugin)

  fastify.ready(() => {
    assert.ok(fastify.parseCookie)
    assert.deepStrictEqual({ ...fastify.parseCookie('foo=bar', {}) }, { foo: 'bar' })
  })
})

test('cookies set with plugin options parseOptions field', (t) => {
  const fastify = Fastify()
  fastify.register(plugin, {
    parseOptions: {
      path: '/test',
      domain: 'example.com'
    }
  })

  fastify.get('/test', (req, reply) => {
    reply.setCookie('foo', 'foo').send({ hello: 'world' })
  })

  fastify.inject(
    {
      method: 'GET',
      url: '/test'
    }).then((res) => {
    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.body), { hello: 'world' })

    const cookies = res.cookies
    assert.strictEqual(cookies.length, 1)
    assert.strictEqual(cookies[0].name, 'foo')
    assert.strictEqual(cookies[0].value, 'foo')
    assert.strictEqual(cookies[0].path, '/test')
    assert.strictEqual(cookies[0].domain, 'example.com')
  }).catch(err => {
    assert.fail(err)
  })
})

test('create signed cookie manually using signCookie decorator', async (t) => {
  const fastify = Fastify()

  await fastify.register(plugin, { secret: 'secret' })

  fastify.get('/test1', (req, reply) => {
    reply.send({
      unsigned: req.unsignCookie(req.cookies.foo)
    })
  })

  const res = await fastify.inject({
    method: 'GET',
    url: '/test1',
    headers: { cookie: `foo=${fastify.signCookie('bar')}` }
  })
  assert.strictEqual(res.statusCode, 200)
  assert.deepStrictEqual(JSON.parse(res.body), { unsigned: { value: 'bar', renew: false, valid: true } })
})

test('handle secure:auto of cookieOptions', async (t) => {
  const fastify = Fastify({ trustProxy: true })

  await fastify.register(plugin)

  fastify.get('/test1', (req, reply) => {
    reply
      .setCookie('foo', 'foo', { path: '/', secure: 'auto' })
      .send()
  })

  const res = await fastify.inject({
    method: 'GET',
    url: '/test1',
    headers: { 'x-forwarded-proto': 'https' }
  })

  const cookies = res.cookies
  assert.strictEqual(cookies.length, 1)
  assert.strictEqual(cookies[0].name, 'foo')
  assert.strictEqual(cookies[0].value, 'foo')
  assert.strictEqual(cookies[0].secure, true)
  assert.strictEqual(cookies[0].path, '/')

  const res2 = await fastify.inject({
    method: 'GET',
    url: '/test1'
  })

  const cookies2 = res2.cookies
  assert.strictEqual(cookies2.length, 1)
  assert.strictEqual(cookies2[0].name, 'foo')
  assert.strictEqual(cookies2[0].value, 'foo')
  assert.strictEqual(cookies2[0].sameSite, 'Lax')
  assert.deepStrictEqual(cookies2[0].secure, undefined)
  assert.strictEqual(cookies2[0].path, '/')
})

test('should not decorate fastify, request and reply if no secret was provided', async (t) => {
  const fastify = Fastify()

  await fastify.register(plugin)

  assert.ok(!fastify.signCookie)
  assert.ok(!fastify.unsignCookie)

  fastify.get('/testDecorators', (req, reply) => {
    assert.ok(!req.signCookie)
    assert.ok(!reply.signCookie)
    assert.ok(!req.unsignCookie)
    assert.ok(!reply.unsignCookie)

    reply.send({
      unsigned: req.unsignCookie(req.cookies.foo)
    })
  })

  const res = await fastify.inject({
    method: 'GET',
    url: '/testDecorators'
  })

  assert.strictEqual(res.statusCode, 500)
  assert.deepStrictEqual(JSON.parse(res.body), {
    statusCode: 500,
    error: 'Internal Server Error',
    message: 'req.unsignCookie is not a function'
  })
})

test('dont add auto cookie parsing to onRequest-hook if hook-option is set to false', (t) => {
  const fastify = Fastify()
  fastify.register(plugin, { hook: false })

  for (const hook of ['preValidation', 'preHandler', 'preParsing']) {
    fastify.addHook(hook, async (req) => {
      assert.strictEqual(req.cookies, null)
    })
  }

  fastify.get('/disable', (req, reply) => {
    assert.strictEqual(req.cookies, null)
    reply.send()
  })

  fastify.inject({
    method: 'GET',
    url: '/disable',
    headers: {
      cookie: 'bar=bar'
    }
  }).then((res) => {
    assert.strictEqual(res.statusCode, 200)
  }).catch(err => {
    assert.fail(err)
  })
})

test('result in an error if hook-option is set to an invalid value', async (t) => {
  const fastify = Fastify()

  await assert.rejects(
    async () => fastify.register(plugin, { hook: true }),
    new Error("@fastify/cookie: Invalid value provided for the hook-option. You can set the hook-option only to false, 'onRequest' , 'preParsing' , 'preValidation' or 'preHandler'")
  )
})

test('correct working plugin if hook-option to preParsing', (t) => {
  const fastify = Fastify()
  fastify.register(plugin, { hook: 'preParsing' })

  fastify.addHook('onRequest', async (req) => {
    assert.strictEqual(req.cookies, null)
  })

  fastify.addHook('preValidation', async (req) => {
    assert.strictEqual(req.cookies.bar, 'bar')
  })

  fastify.get('/preparsing', (req, reply) => {
    assert.strictEqual(req.cookies.bar, 'bar')
    reply.send()
  })

  fastify.inject({
    method: 'GET',
    url: '/preparsing',
    headers: {
      cookie: 'bar=bar'
    }
  }).then((res) => {
    assert.strictEqual(res.statusCode, 200)
  }).catch(err => {
    assert.fail(err)
  })
})

test('if cookies are not set, then the handler creates an empty req.cookies object', (t) => {
  const fastify = Fastify()
  fastify.register(plugin, { hook: 'preParsing' })

  fastify.addHook('onRequest', async (req) => {
    assert.strictEqual(req.cookies, null)
  })

  fastify.addHook('preValidation', async (req) => {
    assert.ok(req.cookies)
  })

  fastify.get('/preparsing', (req, reply) => {
    assert.ok(req.cookies)
    reply.send()
  })

  fastify.inject({
    method: 'GET',
    url: '/preparsing'
  }).then((res) => {
    assert.strictEqual(res.statusCode, 200)
  }).catch(err => {
    assert.fail(err)
  })
})

test('clearCookie should include parseOptions', (t) => {
  const fastify = Fastify()
  fastify.register(plugin, {
    parseOptions: {
      path: '/test',
      domain: 'example.com'
    }
  })

  const cookieOptions = {
    path: '/test',
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
  }).then((res) => {
    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.body), { hello: 'world' })

    const cookies = res.cookies

    assert.strictEqual(cookies.length, 1)
    assert.strictEqual(cookies[0].name, 'foo')
    assert.strictEqual(cookies[0].value, '')
    assert.strictEqual(cookies[0].maxAge, 0)
    assert.strictEqual(cookies[0].path, '/test')
    assert.strictEqual(cookies[0].domain, 'example.com')

    assert.ok(new Date(cookies[0].expires) < new Date())
  }).catch(err => {
    assert.fail(err)
  })
})

test('should update a cookie value when setCookie is called multiple times', (t) => {
  const fastify = Fastify()
  const secret = 'testsecret'
  fastify.register(plugin, { secret })

  const cookieOptions = {
    signed: true,
    path: '/foo',
    maxAge: 36000
  }

  const cookieOptions2 = {
    signed: true,
    maxAge: 36000
  }

  fastify.get('/test1', (req, reply) => {
    reply
      .setCookie('foo', 'foo', cookieOptions)
      .clearCookie('foo', cookieOptions)
      .setCookie('foo', 'foo', cookieOptions2)
      .setCookie('foos', 'foos', cookieOptions)
      .setCookie('foos', 'foosy', cookieOptions)
      .send({ hello: 'world' })
  })

  fastify.inject({
    method: 'GET',
    url: '/test1'
  }).then((res) => {
    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.body), { hello: 'world' })

    const cookies = res.cookies
    assert.strictEqual(cookies.length, 3)

    assert.strictEqual(cookies[0].name, 'foo')
    assert.strictEqual(cookies[0].value, '')
    assert.strictEqual(cookies[0].path, '/foo')

    assert.strictEqual(cookies[1].name, 'foo')
    assert.strictEqual(cookies[1].value, sign('foo', secret))
    assert.strictEqual(cookies[1].maxAge, 36000)

    assert.strictEqual(cookies[2].name, 'foos')
    assert.strictEqual(cookies[2].value, sign('foosy', secret))
    assert.strictEqual(cookies[2].path, '/foo')
    assert.strictEqual(cookies[2].maxAge, 36000)

    assert.ok(new Date(cookies[0].expires) < new Date())
  }).catch(err => {
    assert.fail(err)
  })
})

test('should update a cookie value when setCookie is called multiple times (empty header)', (t) => {
  const fastify = Fastify()
  const secret = 'testsecret'
  fastify.register(plugin, { secret })

  const cookieOptions = {
    signed: true,
    path: '/foo',
    maxAge: 36000
  }

  const cookieOptions2 = {
    signed: true,
    maxAge: 36000
  }

  fastify.get('/test1', (req, reply) => {
    reply
      .header('Set-Cookie', '', cookieOptions)
      .setCookie('foo', 'foo', cookieOptions)
      .clearCookie('foo', cookieOptions)
      .setCookie('foo', 'foo', cookieOptions2)
      .setCookie('foos', 'foos', cookieOptions)
      .setCookie('foos', 'foosy', cookieOptions)
      .send({ hello: 'world' })
  })

  fastify.inject({
    method: 'GET',
    url: '/test1'
  }).then((res) => {
    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.body), { hello: 'world' })

    const cookies = res.cookies
    assert.strictEqual(cookies.length, 3)

    assert.strictEqual(cookies[0].name, 'foo')
    assert.strictEqual(cookies[0].value, '')
    assert.strictEqual(cookies[0].path, '/foo')

    assert.strictEqual(cookies[1].name, 'foo')
    assert.strictEqual(cookies[1].value, sign('foo', secret))
    assert.strictEqual(cookies[1].maxAge, 36000)

    assert.strictEqual(cookies[2].name, 'foos')
    assert.strictEqual(cookies[2].value, sign('foosy', secret))
    assert.strictEqual(cookies[2].path, '/foo')
    assert.strictEqual(cookies[2].maxAge, 36000)

    assert.ok(new Date(cookies[0].expires) < new Date())
  }).catch(err => {
    assert.fail(err)
  })
})

test('should update a cookie value when setCookie is called multiple times (non-empty header)', (t) => {
  const fastify = Fastify()
  const secret = 'testsecret'
  fastify.register(plugin, { secret })

  const cookieOptions = {
    signed: true,
    path: '/foo',
    maxAge: 36000
  }

  const cookieOptions2 = {
    signed: true,
    maxAge: 36000
  }

  fastify.get('/test1', (req, reply) => {
    reply
      .header('Set-Cookie', 'manual=manual', cookieOptions)
      .setCookie('foo', 'foo', cookieOptions)
      .clearCookie('foo', cookieOptions)
      .setCookie('foo', 'foo', cookieOptions2)
      .setCookie('foos', 'foos', cookieOptions)
      .setCookie('foos', 'foosy', cookieOptions)
      .send({ hello: 'world' })
  })

  fastify.inject({
    method: 'GET',
    url: '/test1'
  }).then((res) => {
    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.body), { hello: 'world' })

    const cookies = res.cookies
    assert.strictEqual(cookies.length, 4)

    assert.strictEqual(cookies[1].name, 'foo')
    assert.strictEqual(cookies[1].value, '')
    assert.strictEqual(cookies[1].path, '/foo')

    assert.strictEqual(cookies[2].name, 'foo')
    assert.strictEqual(cookies[2].value, sign('foo', secret))
    assert.strictEqual(cookies[2].maxAge, 36000)

    assert.strictEqual(cookies[3].name, 'foos')
    assert.strictEqual(cookies[3].value, sign('foosy', secret))
    assert.strictEqual(cookies[3].path, '/foo')
    assert.strictEqual(cookies[3].maxAge, 36000)

    assert.ok(new Date(cookies[1].expires) < new Date())
  }).catch(err => {
    assert.fail(err)
  })
})

test('cookies get set correctly if set inside onSend', (t) => {
  const fastify = Fastify()
  fastify.register(plugin)

  fastify.addHook('onSend', async (req, reply, payload) => {
    reply.setCookie('foo', 'foo', { path: '/' })
    return payload
  })

  fastify.get('/test1', (req, reply) => {
    reply
      .send({ hello: 'world' })
  })

  fastify.inject({
    method: 'GET',
    url: '/test1'
  }).then((res) => {
    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.body), { hello: 'world' })

    const cookies = res.cookies
    assert.strictEqual(cookies.length, 1)
    assert.strictEqual(cookies[0].name, 'foo')
    assert.strictEqual(cookies[0].value, 'foo')
    assert.strictEqual(cookies[0].path, '/')
  }).catch(err => {
    assert.fail(err)
  })
})

test('cookies get set correctly if set inside multiple onSends', (t) => {
  const fastify = Fastify()
  fastify.register(plugin)

  fastify.addHook('onSend', async (req, reply, payload) => {
    reply.setCookie('foo', 'foo', { path: '/' })
  })

  fastify.addHook('onSend', async (req, reply, payload) => {
    reply.setCookie('foo', 'foos', { path: '/' })
    return payload
  })

  fastify.get('/test1', (req, reply) => {
    reply
      .send({ hello: 'world' })
  })

  fastify.inject({
    method: 'GET',
    url: '/test1'
  }).then((res) => {
    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.body), { hello: 'world' })

    const cookies = res.cookies
    assert.strictEqual(cookies.length, 2)
    assert.strictEqual(cookies[0].name, 'foo')
    assert.strictEqual(cookies[0].value, 'foo')
    assert.strictEqual(cookies[0].path, '/')

    assert.strictEqual(cookies[1].name, 'foo')
    assert.strictEqual(cookies[1].value, 'foos')
    assert.strictEqual(cookies[1].path, '/')
  }).catch(err => {
    assert.fail(err)
  })
})

test('cookies get set correctly if set inside onRequest', (t) => {
  const fastify = Fastify()
  fastify.addHook('onRequest', async (req, reply) => {
    reply.setCookie('foo', 'foo', { path: '/' })
    return reply.send({ hello: 'world' })
  })

  fastify.register(plugin)

  fastify.inject({
    method: 'GET',
    url: '/test1'
  }).then((res) => {
    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.body), { hello: 'world' })

    const cookies = res.cookies
    assert.strictEqual(cookies.length, 1)
    assert.strictEqual(cookies[0].name, 'foo')
    assert.strictEqual(cookies[0].value, 'foo')
    assert.strictEqual(cookies[0].path, '/')
  }).catch(err => {
    assert.fail(err)
  })
})

test('do not crash if the onRequest hook is not run', (t) => {
  const fastify = Fastify()
  fastify.addHook('onRequest', async (req, reply) => {
    return reply.send({ hello: 'world' })
  })

  fastify.register(plugin)

  fastify.inject({
    method: 'GET',
    url: '/test1',
    headers: {
      cookie: 'foo=foo'
    }
  }).then((res) => {
    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(JSON.parse(res.body), { hello: 'world' })
  }).catch(err => {
    assert.fail(err)
  })
})
