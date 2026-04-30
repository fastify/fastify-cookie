import { expect } from 'tstyche'
import * as fastifyCookieStar from '..'
import fastifyCookieCjsImport = require('..')
import cookie, { fastifyCookie as fastifyCookieNamed, Signer } from '..'
import fastify, {
  type FastifyInstance,
  type FastifyReply,
  type setCookieWrapper
} from 'fastify'

const fastifyCookieCjs = require('..')

const app: FastifyInstance = fastify()
app.register(fastifyCookieNamed)
app.register(cookie)
app.register(fastifyCookieCjs)
app.register(fastifyCookieCjsImport.default)
app.register(fastifyCookieCjsImport.fastifyCookie)
app.register(fastifyCookieStar.default)
app.register(fastifyCookieStar.fastifyCookie)

expect(fastifyCookieNamed).type.toBe<fastifyCookieStar.FastifyCookie>()
expect(cookie).type.toBe<fastifyCookieStar.FastifyCookie>()
expect(
  fastifyCookieCjsImport.default
).type.toBe<fastifyCookieStar.FastifyCookie>()
expect(
  fastifyCookieCjsImport.fastifyCookie
).type.toBe<fastifyCookieStar.FastifyCookie>()
expect(fastifyCookieStar.default).type.toBe<fastifyCookieStar.FastifyCookie>()
expect(
  fastifyCookieStar.fastifyCookie
).type.toBe<fastifyCookieStar.FastifyCookie>()
expect(fastifyCookieCjs).type.toBe<any>()

expect(cookie.sign).type.toBe<fastifyCookieStar.Sign>()
expect(cookie.unsign).type.toBe<fastifyCookieStar.Unsign>()
expect(cookie.signerFactory).type.toBe<fastifyCookieStar.SignerFactory>()

expect(fastifyCookieNamed.sign).type.toBe<fastifyCookieStar.Sign>()
expect(fastifyCookieNamed.unsign).type.toBe<fastifyCookieStar.Unsign>()
expect(
  fastifyCookieNamed.signerFactory
).type.toBe<fastifyCookieStar.SignerFactory>()

const server = fastify()

server.register(cookie)

server.after((_err) => {
  expect(
    server.serializeCookie('sessionId', 'aYb4uTIhdBXC')
  ).type.toBe<string>()

  expect(server.parseCookie('sessionId=aYb4uTIhdBXC')).type.toBe<{
    [key: string]: string;
  }>()

  server.get('/', (request, reply) => {
    const test = request.cookies.test
    expect(test).type.toBe<string | undefined>()

    expect(reply.cookie).type.toBe<setCookieWrapper>()
    expect(reply.setCookie).type.toBe<setCookieWrapper>()

    expect(
      reply
        .setCookie('test', test!, { domain: 'example.com', path: '/' })
        .clearCookie('foo')
        .send({ hello: 'world' })
    ).type.toBe<FastifyReply>()
  })

  expect(server.signCookie).type.toBe<(value: string) => string>()
  expect(server.unsignCookie).type.toBe<
    (value: string) => fastifyCookieStar.UnsignResult
  >()

  server.get('/', (request, reply) => {
    expect(request.signCookie).type.toBe<(value: string) => string>()
    expect(reply.signCookie).type.toBe<(value: string) => string>()
    expect(request.unsignCookie).type.toBe<
      (value: string) => fastifyCookieStar.UnsignResult
    >()
    expect(reply.unsignCookie).type.toBe<
      (value: string) => fastifyCookieStar.UnsignResult
    >()
  })
})

const serverWithHttp2 = fastify({ http2: true })

serverWithHttp2.register(cookie)

serverWithHttp2.after(() => {
  serverWithHttp2.get('/', (request, reply) => {
    const test = request.cookies.test
    reply
      .setCookie('test', test!, { domain: 'example.com', path: '/' })
      .clearCookie('foo')
      .send({ hello: 'world' })
  })
})

const testSamesiteOptionsApp = fastify()

testSamesiteOptionsApp.register(cookie)
testSamesiteOptionsApp.after(() => {
  server.get('/test-samesite-option-true', (request, reply) => {
    const test = request.cookies.test
    reply.setCookie('test', test!, { sameSite: true }).send({ hello: 'world' })
  })
  server.get('/test-samesite-option-false', (request, reply) => {
    const test = request.cookies.test
    reply
      .setCookie('test', test!, { sameSite: false })
      .send({ hello: 'world' })
  })
  server.get('/test-samesite-option-lax', (request, reply) => {
    const test = request.cookies.test
    reply
      .setCookie('test', test!, { sameSite: 'lax' })
      .send({ hello: 'world' })
  })
  server.get('/test-samesite-option-strict', (request, reply) => {
    const test = request.cookies.test
    reply
      .setCookie('test', test!, { sameSite: 'strict' })
      .send({ hello: 'world' })
  })
  server.get('/test-samesite-option-none', (request, reply) => {
    const test = request.cookies.test
    reply
      .setCookie('test', test!, { sameSite: 'none' })
      .send({ hello: 'world' })
  })
})

const appWithImplicitHttpSigned = fastify()

appWithImplicitHttpSigned.register(cookie, {
  secret: 'testsecret'
})
appWithImplicitHttpSigned.register(cookie, {
  secret: 'testsecret',
  algorithm: 'sha512'
})
appWithImplicitHttpSigned.after(() => {
  server.get('/', (request, reply) => {
    appWithImplicitHttpSigned.unsignCookie(request.cookies.test!)
    appWithImplicitHttpSigned.unsignCookie('test')

    reply.unsignCookie(request.cookies.test!)
    reply.unsignCookie('test')

    request.unsignCookie(request.cookies.anotherTest!)
    request.unsignCookie('anotherTest')

    reply.send({ hello: 'world' })
  })
})

const appWithRotationSecret = fastify()

appWithRotationSecret.register(cookie, {
  secret: ['testsecret']
})
appWithRotationSecret.after(() => {
  server.get('/', (request, reply) => {
    reply.unsignCookie(request.cookies.test!)
    const unsigned = reply.unsignCookie('test')

    expect(unsigned.valid).type.toBe<boolean>()
    if (unsigned.valid) {
      expect(unsigned.value).type.toBe<string>()
    } else {
      expect(unsigned.value).type.toBe<null>()
    }
    expect(unsigned.renew).type.toBe<boolean>()

    reply.send({ hello: 'world' })
  })
})

const appWithParseOptions = fastify()

const parseOptions: fastifyCookieStar.CookieSerializeOptions = {
  domain: 'example.com',
  encode: (value: string) => value,
  expires: new Date(),
  httpOnly: true,
  maxAge: 3600,
  path: '/',
  sameSite: 'lax',
  secure: true,
  signed: true,
  partitioned: false
}
expect(parseOptions).type.toBe<fastifyCookieStar.CookieSerializeOptions>()

appWithParseOptions.register(cookie, {
  secret: 'testsecret',
  parseOptions
})
appWithParseOptions.after(() => {
  server.get('/', (request, reply) => {
    const unsigned = reply.unsignCookie(request.cookies.test!)

    expect(unsigned.valid).type.toBe<boolean>()
    if (unsigned.valid) {
      expect(unsigned.value).type.toBe<string>()
    } else {
      expect(unsigned.value).type.toBe<null>()
    }
    expect(unsigned.renew).type.toBe<boolean>()
  })
})

const appWithCustomSigner = fastify()

appWithCustomSigner.register(cookie, {
  secret: {
    sign: (x) => x + '.signed',
    unsign: (x) => {
      if (x.endsWith('.signed')) {
        return { renew: false, valid: true, value: x.slice(0, -7) }
      }
      return { renew: false, valid: false, value: null }
    }
  }
})
appWithCustomSigner.after(() => {
  server.get('/', (request, reply) => {
    reply.unsignCookie(request.cookies.test!)
    const unsigned = reply.unsignCookie('test')

    expect(unsigned.valid).type.toBe<boolean>()
    if (unsigned.valid) {
      expect(unsigned.value).type.toBe<string>()
    } else {
      expect(unsigned.value).type.toBe<null>()
    }
    expect(unsigned.renew).type.toBe<boolean>()

    reply.send({ hello: 'world' })
  })
})

expect(new fastifyCookieStar.Signer('secretString')).type.toBe<Signer>()
expect(
  new fastifyCookieStar.Signer(['secretStringInArray'])
).type.toBe<Signer>()
expect(
  new fastifyCookieStar.Signer(Buffer.from('secretString'))
).type.toBe<Signer>()
expect(
  new fastifyCookieStar.Signer([Buffer.from('secretStringInArray')])
).type.toBe<Signer>()

const signer = new fastifyCookieStar.Signer(['secretStringInArray'], 'sha256')
signer.sign('Lorem Ipsum')
signer.unsign('Lorem Ipsum')

const appWithHook: FastifyInstance = fastify()

appWithHook.register(cookie, { hook: false })
appWithHook.register(cookie, { hook: 'onRequest' })
appWithHook.register(cookie, { hook: 'preHandler' })
appWithHook.register(cookie, { hook: 'preParsing' })
appWithHook.register(cookie, { hook: 'preSerialization' })
appWithHook.register(cookie, { hook: 'preValidation' })

expect(appWithHook.register)
  .type.not.toBeCallableWith(cookie, { hook: true })
expect(appWithHook.register)
  .type.not.toBeCallableWith(cookie, { hook: 'false' })

expect(cookie.parse).type.toBe<
  (
    cookieHeader: string,
    opts?: fastifyCookieStar.ParseOptions
  ) => { [key: string]: string }
>()
expect(cookie.serialize).type.toBe<
  (
    name: string,
    value: string,
    opts?: fastifyCookieStar.SerializeOptions
  ) => string
>()
