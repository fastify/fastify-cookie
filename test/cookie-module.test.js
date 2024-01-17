'use strict'

const tap = require('tap')
const test = tap.test

const cookie = require('..')

test('parse: argument validation', (t) => {
  t.plan(2)
  t.throws(cookie.parse.bind(), /argument str must be a string/)
  t.throws(cookie.parse.bind(null, 42), /argument str must be a string/)
  t.end()
})

test('parse: basic', (t) => {
  t.plan(2)
  t.same(cookie.parse('foo=bar'), { foo: 'bar' })
  t.same(cookie.parse('foo=123'), { foo: '123' })
  t.end()
})

test('parse: ignore spaces', (t) => {
  t.plan(1)
  t.same(cookie.parse('FOO    = bar;   baz  =   raz'), { FOO: 'bar', baz: 'raz' })
  t.end()
})

test('parse: escaping', (t) => {
  t.plan(2)
  t.same(cookie.parse('foo="bar=123456789&name=Magic+Mouse"'), { foo: 'bar=123456789&name=Magic+Mouse' })
  t.same(cookie.parse('email=%20%22%2c%3b%2f'), { email: ' ",;/' })
  t.end()
})

test('parse: ignore escaping error and return original value', (t) => {
  t.plan(1)
  t.same(cookie.parse('foo=%1;bar=bar'), { foo: '%1', bar: 'bar' })
  t.end()
})

test('parse: ignore non values', (t) => {
  t.plan(1)
  t.same(cookie.parse('foo=%1;bar=bar;HttpOnly;Secure'),
    { foo: '%1', bar: 'bar' })
  t.end()
})

test('parse: unencoded', (t) => {
  t.plan(2)
  t.same(cookie.parse('foo="bar=123456789&name=Magic+Mouse"', {
    decode: function (v) { return v }
  }), { foo: 'bar=123456789&name=Magic+Mouse' })

  t.same(cookie.parse('email=%20%22%2c%3b%2f', {
    decode: function (v) { return v }
  }), { email: '%20%22%2c%3b%2f' })
  t.end()
})

test('parse: dates', (t) => {
  t.plan(1)
  t.same(cookie.parse('priority=true; expires=Wed, 29 Jan 2014 17:43:25 GMT; Path=/', {
    decode: function (v) { return v }
  }), { priority: 'true', Path: '/', expires: 'Wed, 29 Jan 2014 17:43:25 GMT' })
  t.end()
})

test('parse: missing value', (t) => {
  t.plan(1)
  t.same(cookie.parse('foo; bar=1; fizz= ; buzz=2', {
    decode: function (v) { return v }
  }), { bar: '1', fizz: '', buzz: '2' })
  t.end()
})

test('parse: assign only once', (t) => {
  t.plan(3)
  t.same(cookie.parse('foo=%1;bar=bar;foo=boo'), { foo: '%1', bar: 'bar' })
  t.same(cookie.parse('foo=false;bar=bar;foo=true'), { foo: 'false', bar: 'bar' })
  t.same(cookie.parse('foo=;bar=bar;foo=boo'), { foo: '', bar: 'bar' })
  t.end()
})

test('serializer: basic', (t) => {
  t.plan(6)
  t.same(cookie.serialize('foo', 'bar'), 'foo=bar')
  t.same(cookie.serialize('foo', 'bar baz'), 'foo=bar%20baz')
  t.same(cookie.serialize('foo', ''), 'foo=')
  t.throws(cookie.serialize.bind(cookie, 'foo\n', 'bar'), /argument name is invalid/)
  t.throws(cookie.serialize.bind(cookie, 'foo\u280a', 'bar'), /argument name is invalid/)
  t.throws(cookie.serialize.bind(cookie, 'foo', 'bar', { encode: 42 }), /option encode is invalid/)
  t.end()
})

test('serializer: path', (t) => {
  t.plan(2)
  t.same(cookie.serialize('foo', 'bar', { path: '/' }), 'foo=bar; Path=/')
  t.throws(cookie.serialize.bind(cookie, 'foo', 'bar', {
    path: '/\n'
  }), /option path is invalid/)
  t.end()
})

test('serializer: secure', (t) => {
  t.plan(2)
  t.same(cookie.serialize('foo', 'bar', { secure: true }), 'foo=bar; Secure')
  t.same(cookie.serialize('foo', 'bar', { secure: false }), 'foo=bar')
  t.end()
})

test('serializer: domain', (t) => {
  t.plan(2)
  t.same(cookie.serialize('foo', 'bar', { domain: 'example.com' }), 'foo=bar; Domain=example.com')
  t.throws(cookie.serialize.bind(cookie, 'foo', 'bar', {
    domain: 'example.com\n'
  }), /option domain is invalid/)
  t.end()
})

test('serializer: httpOnly', (t) => {
  t.plan(1)
  t.same(cookie.serialize('foo', 'bar', { httpOnly: true }), 'foo=bar; HttpOnly')
  t.end()
})

test('serializer: maxAge', (t) => {
  t.plan(9)
  t.throws(function () {
    cookie.serialize('foo', 'bar', {
      maxAge: 'buzz'
    })
  }, /option maxAge is invalid/)

  t.throws(function () {
    cookie.serialize('foo', 'bar', {
      maxAge: Infinity
    })
  }, /option maxAge is invalid/)

  t.same(cookie.serialize('foo', 'bar', { maxAge: 1000 }), 'foo=bar; Max-Age=1000')
  t.same(cookie.serialize('foo', 'bar', { maxAge: '1000' }), 'foo=bar; Max-Age=1000')
  t.same(cookie.serialize('foo', 'bar', { maxAge: 0 }), 'foo=bar; Max-Age=0')
  t.same(cookie.serialize('foo', 'bar', { maxAge: '0' }), 'foo=bar; Max-Age=0')
  t.same(cookie.serialize('foo', 'bar', { maxAge: null }), 'foo=bar')
  t.same(cookie.serialize('foo', 'bar', { maxAge: undefined }), 'foo=bar')
  t.same(cookie.serialize('foo', 'bar', { maxAge: 3.14 }), 'foo=bar; Max-Age=3')
  t.end()
})

test('serializer: expires', (t) => {
  t.plan(2)
  t.same(cookie.serialize('foo', 'bar', {
    expires: new Date(Date.UTC(2000, 11, 24, 10, 30, 59, 900))
  }), 'foo=bar; Expires=Sun, 24 Dec 2000 10:30:59 GMT')

  t.throws(cookie.serialize.bind(cookie, 'foo', 'bar', {
    expires: Date.now()
  }), /option expires is invalid/)
  t.end()
})

test('sameSite', (t) => {
  t.plan(9)
  t.same(cookie.serialize('foo', 'bar', { sameSite: true }), 'foo=bar; SameSite=Strict')
  t.same(cookie.serialize('foo', 'bar', { sameSite: 'Strict' }), 'foo=bar; SameSite=Strict')
  t.same(cookie.serialize('foo', 'bar', { sameSite: 'strict' }), 'foo=bar; SameSite=Strict')
  t.same(cookie.serialize('foo', 'bar', { sameSite: 'Lax' }), 'foo=bar; SameSite=Lax')
  t.same(cookie.serialize('foo', 'bar', { sameSite: 'lax' }), 'foo=bar; SameSite=Lax')
  t.same(cookie.serialize('foo', 'bar', { sameSite: 'None' }), 'foo=bar; SameSite=None')
  t.same(cookie.serialize('foo', 'bar', { sameSite: 'none' }), 'foo=bar; SameSite=None')
  t.same(cookie.serialize('foo', 'bar', { sameSite: false }), 'foo=bar')

  t.throws(cookie.serialize.bind(cookie, 'foo', 'bar', {
    sameSite: 'foo'
  }), /option sameSite is invalid/)
  t.end()
})

test('escaping', (t) => {
  t.plan(1)
  t.same(cookie.serialize('cat', '+ '), 'cat=%2B%20')
  t.end()
})

test('parse->serialize', (t) => {
  t.plan(2)
  t.same(cookie.parse(cookie.serialize('cat', 'foo=123&name=baz five')),
    { cat: 'foo=123&name=baz five' })

  t.same(cookie.parse(cookie.serialize('cat', ' ";/')),
    { cat: ' ";/' })
  t.end()
})

test('unencoded', (t) => {
  t.plan(2)
  t.same(cookie.serialize('cat', '+ ', {
    encode: function (value) { return value }
  }), 'cat=+ ')

  t.throws(cookie.serialize.bind(cookie, 'cat', '+ \n', {
    encode: function (value) { return value }
  }), /argument val is invalid/)
  t.end()
})

test('serializer: priority', (t) => {
  t.plan(8)
  t.same(cookie.serialize('foo', 'bar', { priority: 'Low' }), 'foo=bar; Priority=Low')
  t.same(cookie.serialize('foo', 'bar', { priority: 'low' }), 'foo=bar; Priority=Low')
  t.same(cookie.serialize('foo', 'bar', { priority: 'Medium' }), 'foo=bar; Priority=Medium')
  t.same(cookie.serialize('foo', 'bar', { priority: 'medium' }), 'foo=bar; Priority=Medium')
  t.same(cookie.serialize('foo', 'bar', { priority: 'High' }), 'foo=bar; Priority=High')
  t.same(cookie.serialize('foo', 'bar', { priority: 'high' }), 'foo=bar; Priority=High')

  t.throws(cookie.serialize.bind(cookie, 'foo', 'bar', {
    priority: 'foo'
  }), /option priority is invalid/)
  t.throws(cookie.serialize.bind(cookie, 'foo', 'bar', {
    priority: true
  }), /option priority is invalid/)
  t.end()
})
