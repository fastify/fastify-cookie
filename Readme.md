# fastify-cookie

[![Greenkeeper badge](https://badges.greenkeeper.io/fastify/fastify-cookie.svg)](https://greenkeeper.io/) [![Build Status](https://travis-ci.org/fastify/fastify-cookie.svg?branch=master)](https://travis-ci.org/fastify/fastify-cookie)

A plugin for [Fastify](http://fastify.io/) that adds support for reading and
setting cookies.

This plugin's cookie parsing works via Fastify's `onRequest` hook. Therefore,
you should register it prior to any other `onRequest` hooks that will depend
upon this plugin's actions.

`fastify-cookie` [v2.x](https://github.com/fastify/fastify-cookie/tree/v2.x)
supports both Fastify@1 and Fastify@2.
`fastify-cookie` v3 only supports Fastify@2.

## Example

```js
const fastify = require('fastify')()

fastify.register(require('fastify-cookie'))

fastify.get('/', (req, reply) => {
  const aCookieValue = req.cookies.cookieName
  reply
    .setCookie('foo', 'foo', {
      domain: 'example.com',
      path: '/'
    })
    .send({hello: 'world'})
})
```

## API

### Parsing

Cookies are parsed in the `onRequest` Fastify hook and attached to the request
as an object named `cookies`. Thus, if a request contains the header
`Cookie: foo=foo` then, within your handler, `req.cookies.foo` would equal
`'foo'`.

### Sending

The method `setCookie(name, value, options)` is added to the `reply` object
via the Fastify `decorateReply` API. Thus, in a request handler,
`reply.setCookie('foo', 'foo', {path: '/'})` will set a cookie named `foo`
with a value of `'foo'` on the cookie path `/`.

+ `name`: a string name for the cookie to be set
+ `value`: a string value for the cookie
+ `options`: an options object as described in the [cookie serialize][cs]
documentation

### Clearing 

The method `clearCookie(name, options)` is added to the `reply` object
via the Fastify `decorateReply` API. Thus, in a request handler,
`reply.clearCookie('foo', {path: '/'})` will clear a cookie named `foo`
on the cookie path `/`.

+ `name`: a string name for the cookie to be cleared
+ `options`: an options object as described in the [cookie serialize][cs]
documentation. Its optional to pass `options` object

[cs]: https://www.npmjs.com/package/cookie#options-1

## License

[MIT License](http://jsumners.mit-license.org/)
