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
