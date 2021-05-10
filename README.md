# fastify-cookie

![CI](https://github.com/fastify/fastify-cookie/workflows/CI/badge.svg)
[![NPM version](https://img.shields.io/npm/v/fastify-cookie.svg?style=flat)](https://www.npmjs.com/package/fastify-cookie)
[![Known Vulnerabilities](https://snyk.io/test/github/fastify/fastify-cookie/badge.svg)](https://snyk.io/test/github/fastify/fastify-cookie)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://standardjs.com/)

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
  // `reply.unsignCookie()` is also available
  const bCookie = req.unsignCookie(req.cookies.cookieSigned);
  reply
    .setCookie('foo', 'foo', {
      domain: 'example.com',
      path: '/'
    })
    .cookie('baz', 'baz') // alias for setCookie
    .setCookie('bar', 'bar', {
      path: '/',
      signed: true
    })
    .send({ hello: 'world' })
})
```

## TypeScript Example

```ts
import { FastifyCookieOptions } from 'fastify-cookie'
import cookie from 'fastify-cookie'
import fastify from 'fastify'

const app = fastify()

app.register(cookie, {
  secret: "my-secret", // for cookies signature
  parseOptions: {}     // options for parsing cookies
} as FastifyCookieOptions)
```

## Options

- `secret` (`String` | `Array` | `Object`):
  - A `String` can be passed to use as secret to sign the cookie using [`cookie-signature`](http://npm.im/cookie-signature).
  - An `Array` can be passed if key rotation is desired. Read more about it in [Rotating signing secret](#rotating-secret).
  - More sophisticated cookie signing mechanisms can be implemented by supplying an `Object`. Read more about it in [Custom cookie signer](#custom-cookie-signer).

- `parseOptions`: An `Object` to pass as options to [cookie parse](https://github.com/jshttp/cookie#cookieparsestr-options).

## API

### Parsing

Cookies are parsed in the `onRequest` Fastify hook and attached to the request
as an object named `cookies`. Thus, if a request contains the header
`Cookie: foo=foo` then, within your handler, `req.cookies.foo` would equal
`'foo'`.

You can pass options to the [cookie parse](https://github.com/jshttp/cookie#cookieparsestr-options) by setting an object named `parseOptions` in the plugin config object.

### Sending

The method `setCookie(name, value, options)`, and its alias `cookie(name, value, options)`, are added to the `reply` object
via the Fastify `decorateReply` API. Thus, in a request handler,
`reply.setCookie('foo', 'foo', {path: '/'})` will set a cookie named `foo`
with a value of `'foo'` on the cookie path `/`.

+ `name`: a string name for the cookie to be set
+ `value`: a string value for the cookie
+ `options`: an options object as described in the [cookie serialize][cs] documentation
  with a extra param "signed" for signed cookie

#### Securing the cookie

Following are _some_ of the precautions that should be taken to ensure the integrity of an application:

- It's important to use `options.httpOnly` cookies to prevent attacks like XSS.
- Use signed cookies (`options.signed`) to ensure they are not getting tampered with on client-side by an attacker.
- Use `__Host-` [Cookie Prefix](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#Attributes) to avoid Cookie Tossing attacks.
- it's important to [use HTTPS for your website/app](https://letsencrypt.org/) to avoid a bunch of other potential security issues like [MITM](https://en.wikipedia.org/wiki/Man-in-the-middle_attack) etc.

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

<a id="rotating-secret"></a>
### Rotating signing secret

Key rotation is when an encryption key is retired and replaced by generating a new cryptographic key. To implement rotation, supply an `Array` of keys to `secret` option.

**Example:**
```js
fastify.register(require('fastify-cookie'), {
  secret: [key1, key2]
})
```

The plugin will **always** use the first key (`key1`) to sign cookies. When parsing incoming cookies, it will iterate over the supplied array to see if any of the available keys are able to decode the given signed cookie. This ensures that any old signed cookies are still valid.

Note:
- Key rotation is **only** achieved by redeploying the server again with the new `secret` array.
- Iterating through all secrets is an expensive process, so the rotation list should contain as few keys as possible. Ideally, only the current key and the most recently retired key.
- Although previously signed cookies are valid even after rotation, cookies should be updated with the new key as soon as possible. See the following example for how to accomplish this.

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

<a id="custom-cookie-signer"></a>
### Custom cookie signer

The `secret` option optionally accepts an object with `sign` and `unsign` functions. This allows for implementing a custom cookie signing mechanism. See the following example:

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
      return {
        valid: true, // the cookie has been unsigned successfully
        renew: false, // the cookie has been unsigned with an old secret
        value: 'unsignedValue'
      }
    }
  }
})
```

### Manual cookie unsigning

The method `unsignCookie(value)` is added to the `fastify` instance and the `reply` object
via the Fastify `decorate` & `decorateReply` APIs. Using it on a signed cookie will call the
the provided signer's (or the default signer if no custom implementation is provided) `unsign` method on the cookie.

**Example:**

```js
fastify.register(require('fastify-cookie'), { secret: 'my-secret' })

fastify.get('/', (req, rep) => {
  if (fastify.unsign(req.cookie.foo).valid === false) {
    rep.send('cookie is invalid')
    return
  }

  rep.send('cookie is valid')
})
```


## License

[MIT License](http://jsumners.mit-license.org/)
