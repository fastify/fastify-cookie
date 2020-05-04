import fastify from 'fastify';
import cookie from '../plugin';

const server = fastify();

server.register(cookie);

server.after((_err) => {
  server.get('/', (request, reply) => {
    const test = request.cookies.test;
    reply
      .setCookie('test', test, { domain: 'example.com', path: '/' })
      .clearCookie('foo')
      .send({ hello: 'world' });
  })
});

const serverWithHttp2 = fastify({ http2: true });

serverWithHttp2.register(cookie)

serverWithHttp2.after(() => {
  serverWithHttp2.get('/', (request, reply) => {
    const test = request.cookies.test;
    reply
      .setCookie('test', test, { domain: 'example.com', path: '/' })
      .clearCookie('foo')
      .send({ hello: 'world' });
  })
});

const testSamesiteOptionsApp = fastify();

testSamesiteOptionsApp.register(cookie)
testSamesiteOptionsApp.after(() => {
  server.get('/test-samesite-option-true', (request, reply) => {
    const test = request.cookies.test;
    reply
      .setCookie('test', test, { sameSite: true })
      .send({ hello: 'world' });
  })
  server.get('/test-samesite-option-false', (request, reply) => {
    const test = request.cookies.test;
    reply
      .setCookie('test', test, { sameSite: false })
      .send({ hello: 'world' });
  })
  server.get('/test-samesite-option-lax', (request, reply) => {
    const test = request.cookies.test;
    reply
      .setCookie('test', test, { sameSite: 'lax' })
      .send({ hello: 'world' });
  })
  server.get('/test-samesite-option-strict', (request, reply) => {
    const test = request.cookies.test;
    reply
      .setCookie('test', test, { sameSite: 'strict' })
      .send({ hello: 'world' });
  })
  server.get('/test-samesite-option-none', (request, reply) => {
    const test = request.cookies.test;
    reply
      .setCookie('test', test, { sameSite: 'none' })
      .send({ hello: 'world' });
  })
});

const appWithImplicitHttpSigned = fastify();

appWithImplicitHttpSigned
  .register(cookie, {
    secret: 'testsecret'
  })
appWithImplicitHttpSigned.after(() => {
  server.get('/', (request, reply) => {
    reply.unsignCookie(request.cookies.test)
    reply.unsignCookie('test')

    reply
      .send({ hello: 'world' });
  })
});