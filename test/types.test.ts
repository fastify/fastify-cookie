import fastify = require('fastify');
import http2 = require('http2');
import cookie = require('../');

const appWithImplicitHttp = fastify();

appWithImplicitHttp
  .register(cookie)
  .after(() => {
    appWithImplicitHttp.get('/', (request, reply) => {
      const test = request.cookies.test;
      reply
      .setCookie('test', test, { domain: 'example.com', path: '/' })
      .clearCookie('foo')
      .send({hello: 'world'});
    })
  });

const appWithHttp2: fastify.FastifyInstance<
  http2.Http2Server,
  http2.Http2ServerRequest,
  http2.Http2ServerResponse
> = fastify();

appWithHttp2
  .register(cookie)
  .after(() => {
    appWithHttp2.get('/', (request, reply) => {
      const test = request.cookies.test;
      reply
      .setCookie('test', test, { domain: 'example.com', path: '/' })
      .clearCookie('foo')
      .send({hello: 'world'});
    })
  });


const testSamesiteOptionsApp = fastify();

testSamesiteOptionsApp
.register(cookie)
.after(() => {
  appWithImplicitHttp.get('/test-samesite-option-true', (request, reply) => {
    const test = request.cookies.test;
    reply
    .setCookie('test', test, { sameSite: true })
    .send({hello: 'world'});
  })
  appWithImplicitHttp.get('/test-samesite-option-false', (request, reply) => {
    const test = request.cookies.test;
    reply
    .setCookie('test', test, { sameSite: false })
    .send({hello: 'world'});
  })
  appWithImplicitHttp.get('/test-samesite-option-lax', (request, reply) => {
    const test = request.cookies.test;
    reply
    .setCookie('test', test, { sameSite: 'lax' })
    .send({hello: 'world'});
  })
  appWithImplicitHttp.get('/test-samesite-option-strict', (request, reply) => {
    const test = request.cookies.test;
    reply
    .setCookie('test', test, { sameSite: 'strict' })
    .send({hello: 'world'});
  })
  appWithImplicitHttp.get('/test-samesite-option-none', (request, reply) => {
    const test = request.cookies.test;
    reply
    .setCookie('test', test, { sameSite: 'none' })
    .send({hello: 'world'});
  })
});

const appWithImplicitHttpSigned = fastify();

appWithImplicitHttpSigned
  .register(cookie, {
    secret: 'testsecret'
  })
  .after(() => {
    appWithImplicitHttp.get('/', (request, reply) => {
      reply.unsignCookie(request.cookies.test)
      reply.unsignCookie('test')

      reply
      .send({ hello: 'world' });
    })
  });