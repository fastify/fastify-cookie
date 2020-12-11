# fastify-cookie

[![Build Status](https://travis-ci.org/fastify/fastify-cookie.svg?branch=master)](https://travis-ci.org/fastify/fastify-cookie)

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

fastify.register(require('fastify-cookie'), {
  secret: "my-secret", // for cookies signature
  parseOptions: {}     // options for parsing cookies
})

fastify.get('/', (req, reply) => {
  const aCookieValue = req.cookies.cookieName
  const bCookieValue = reply.unsignCookie(req.cookies.cookieSigned);
  reply
    .setCookie('foo', 'foo', {
      domain: 'example.com',
      path: '/'
    })
    .setCookie('bar', 'bar', {
      path: '/',
      signed: true
    })
    .send({hello: 'world'})
})
```

## Options

- `secret`: A `String` to use as secret to sign the cookie using [`cookie-signature`](http://npm.im/cookie-signature). If you want to implement more sophisticated cookie signing mechanism, you can supply an `Object` instead. Read more about it in [Custom cookie signer](#custom-cookie-signer).

- `parseOptions`: An `Object` to pass as options to [cookie parse](https://github.com/jshttp/cookie#cookieparsestr-options).

## API

### Parsing

Cookies are parsed in the `onRequest` Fastify hook and attached to the request
as an object named `cookies`. Thus, if a request contains the header
`Cookie: foo=foo` then, within your handler, `req.cookies.foo` would equal
`'foo'`.

You can pass options to the [cookie parse](https://github.com/jshttp/cookie#cookieparsestr-options) by setting an object named `parseOptions` in the plugin config object.

### Sending

The method `setCookie(name, value, options)` is added to the `reply` object
via the Fastify `decorateReply` API. Thus, in a request handler,
`reply.setCookie('foo', 'foo', {path: '/'})` will set a cookie named `foo`
with a value of `'foo'` on the cookie path `/`.

+ `name`: a string name for the cookie to be set
+ `value`: a string value for the cookie
+ `options`: an options object as described in the [cookie serialize][cs] documentation
  with a extra param "signed" for signed cookie


### Clearing

The method `clearCookie(name, options)` is added to the `reply` object
via the Fastify `decorateReply` API. Thus, in a request handler,
`reply.clearCookie('foo', {path: '/'})` will clear a cookie named `foo`
on the cookie path `/`.

+ `name`: a string name for the cookie to be cleared
+ `options`: an options object as described in the [cookie serialize][cs]
documentation. Its optional to pass `options` object

### Manual cookie parsing

The method `parseCookie(cookieHeader)` is added to the `fastify` instance
via the Fastify `decorate` API. Thus, `fastify.parseCookie('sessionId=aYb4uTIhdBXC')`
will parse the raw cookie header and return an object `{ "sessionId": "aYb4uTIhdBXC" }`.

[cs]: https://www.npmjs.com/package/cookie#options-1

<a name="custom-cookie-signer"></a>
### Custom cookie signer

The `secret` option optionally accepts an object with `sign` and `unsign` functions. Useful if you want to implement custom cookie signing mechanism with rotating signing key for example.

**Example:**
```js
fastify.register(require('fastify-cookie'), {
  secret: {
    sign: (value) => {
      // sign using custom logic
      return signedValue
    },
    unsign: (value) => {
      // unsign using custom logic
      return unsignedValue
    }
  }
})
```

## License

[MIT License](http://jsumners.mit-license.org/)
