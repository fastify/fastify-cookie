import fastify = require('fastify');
import cookie = require('../');

const app = fastify();

app
  .register(cookie)
  .after(() => {
    app.get('/', (request, reply) => {
      const test = request.cookies.test;
      reply.setCookie('test', test, { domain: 'example.com', path: '/' }).send({hello: 'world'});
    })
  });
