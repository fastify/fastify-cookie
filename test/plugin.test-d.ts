import fastify, {FastifyInstance, FastifyPluginCallback} from 'fastify';
import cookie, {FastifyCookieOptions} from '../plugin';
import { expectType } from 'tsd'

import { fastifyCookie as fastifyCookieNamed } from "../";
import fastifyCookieDefault from "../";
import * as fastifyCookieStar from "../";
import fastifyCookieCjsImport = require("../");
import {Server} from "http";
const fastifyCookieCjs = require("../");

const app: FastifyInstance = fastify();
app.register(fastifyCookieNamed);
app.register(fastifyCookieDefault);
app.register(fastifyCookieCjs);
app.register(fastifyCookieCjsImport.default);
app.register(fastifyCookieCjsImport.fastifyCookie);
app.register(fastifyCookieStar.default);
app.register(fastifyCookieStar.fastifyCookie);

expectType<FastifyPluginCallback<FastifyCookieOptions, Server>>(fastifyCookieNamed);
expectType<FastifyPluginCallback<FastifyCookieOptions, Server>>(fastifyCookieDefault);
expectType<FastifyPluginCallback<FastifyCookieOptions, Server>>(fastifyCookieCjsImport.default);
expectType<FastifyPluginCallback<FastifyCookieOptions, Server>>(
  fastifyCookieCjsImport.fastifyCookie
);
expectType<FastifyPluginCallback<FastifyCookieOptions, Server>>(fastifyCookieStar.default);
expectType<FastifyPluginCallback<FastifyCookieOptions, Server>>(
  fastifyCookieStar.fastifyCookie
);
expectType<any>(fastifyCookieCjs);

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

    request.unsignCookie(request.cookies.anotherTest);
    request.unsignCookie('anotherTest');

    reply
      .send({ hello: 'world' });
  })
});

const appWithRotationSecret = fastify()

appWithRotationSecret
  .register(cookie, {
    secret: ['testsecret']
  })
appWithRotationSecret.after(() => {
  server.get('/', (request, reply) => {
    reply.unsignCookie(request.cookies.test)
    const { valid, renew, value } = reply.unsignCookie('test')

    expectType<boolean>(valid)
    expectType<boolean>(renew)
    expectType<string | null>(value)

    reply
      .send({ hello: 'world' });
  })
})
