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
  const bCookie = reply.unsignCookie(req.cookies.cookieSigned);
  reply
    .setCookie('foo', 'foo', {
      domain: 'example.com',
      path: '/'
    })
    .setCookie('bar', 'bar', {
      path: '/',
      signed: true
    })
    .send({ hello: 'world' })
})
```

## Options

- `secret` (`String` | `Array` | `Object`):
  - A `String` can be passed to use as secret to sign the cookie using [`cookie-signature`](http://npm.im/cookie-signature).
  - An `Array` can be passed if you wanna use key rotation. Read more about it in [Rotating signing secret](#rotating-secret).
  - If you want to implement more sophisticated cookie signing mechanism, you can supply an `Object` here. Read more about it in [Custom cookie signer](#custom-cookie-signer).

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

<a name="rotating-secret"></a>
### Rotating signing secret

Key rotation is when you retire an encryption key and replace that old key by generating a new cryptographic key. To implement rotation, you can supply an `Array` of keys to `secret` option.

**Example:**
```js
fastify.register(require('fastify-cookie'), {
  secret: [key1, key2]
})
```

Plugin will **always** use the first key to sign cookies. But to unsign, it will iterate over the supplied array to see if any of the available keys could decode the given signed cookie. This ensures that any old signed cookies are still valid after rotation.

Note:
- Key rotation is **only** achieved by redeploying the server again with the new `secret` array.
- Iterating through all secrets is an expensive process, so you should try to keep the rotation list as small as possible.
- Although previously signed cookies are valid even after rotation, you should make sure to resign them (simply another `setCookie`) as soon as possible to ensure that the subsequent request does not have to iterate over all keys to find the correct one. See example below.

**Example:**
```js
fastify.get('/', (req, reply) => {
  const result = reply.unsignCookie(req.cookies.myCookie)

  if (result.valid && result.renew) {
    // Setting the same cookie again, this time plugin will sign it with a new key
    reply.setCookie('myCookie', result.value, {
      domain: 'example.com', // same options as before
      path: '/',
      signed: true
    })
  }
})
```

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
