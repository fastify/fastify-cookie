# fastify-cookie

A plugin for [Fastify](http://fastify.io/) that adds support for reading and
setting cookies.

This plugin's cookie parsing works via Fastify's `preHandler` hook. Therefore,
you should register it prior to any other `preHandler` hooks that will depend
upon this plugin's actions.

## Example

```js
const fastify = require('fastify')()

fastify.register(require('fastify-cookie'), (err) => {
  if (err) throw err
})

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

Cookies are parsed in the `preHandler` Fastify hook and attached to the request
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

[cs]: https://www.npmjs.com/package/cookie#options-1

## License

[MIT License](http://jsumners.mit-license.org/)
