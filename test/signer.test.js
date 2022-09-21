'use strict'

const { test } = require('tap')
const sinon = require('sinon')
const crypto = require('crypto')
const { Signer, sign, unsign } = require('../signer')

test('default', t => {
  t.plan(5)

  const secret = 'my-secret'
  const signer = Signer(secret)

  t.test('signer.sign should throw if there is no value provided', (t) => {
    t.plan(1)

    t.throws(() => signer.sign(undefined), 'Cookie value must be provided as a string.')
  })

  t.test('signer.sign', (t) => {
    t.plan(2)

    const input = 'some-value'
    const result = signer.sign(input)

    t.equal(result, sign(input, secret))
    t.throws(() => sign(undefined), 'Cookie value must be provided as a string.')
  })

  t.test('sign', (t) => {
    t.plan(5)

    const input = 'some-value'
    const result = signer.sign(input)

    t.equal(result, sign(input, secret))
    t.equal(result, sign(input, [secret]))
    t.equal(result, sign(input, Buffer.from(secret)))
    t.equal(result, sign(input, [Buffer.from(secret)]))

    t.throws(() => sign(undefined), 'Cookie value must be provided as a string.')
  })

  t.test('signer.unsign', (t) => {
    t.plan(4)

    const input = signer.sign('some-value', secret)
    const result = signer.unsign(input)

    t.equal(result.valid, true)
    t.equal(result.renew, false)
    t.equal(result.value, 'some-value')
    t.throws(() => signer.unsign(undefined), 'Signed cookie string must be provided.')
  })

  t.test('unsign', (t) => {
    t.plan(6)

    const input = sign('some-value', secret)
    const result = unsign(input, secret)

    t.equal(result.valid, true)
    t.equal(result.renew, false)
    t.equal(result.value, 'some-value')
    t.same(result, unsign(input, [secret]))
    t.throws(() => unsign(undefined), 'Secret key must be a string or Buffer.')
    t.throws(() => unsign(undefined, secret), 'Signed cookie string must be provided.')
  })
})

test('key rotation', (t) => {
  t.plan(3)
  const secret1 = 'my-secret-1'
  const secret2 = 'my-secret-2'
  const secret3 = 'my-secret-3'
  const signer = Signer([secret1, secret2, secret3])
  const signSpy = sinon.spy(crypto, 'createHmac')

  t.beforeEach(() => {
    signSpy.resetHistory()
  })

  t.test('signer.sign always signs using first key', (t) => {
    t.plan(1)

    const input = 'some-value'
    const result = signer.sign(input)

    t.equal(result, sign(input, secret1))
  })

  t.test('signer.unsign tries to decode using all keys till it finds', (t) => {
    t.plan(4)

    const input = sign('some-value', secret2)
    signSpy.resetHistory()
    const result = signer.unsign(input)

    t.equal(result.valid, true)
    t.equal(result.renew, true)
    t.equal(result.value, 'some-value')
    t.equal(signSpy.callCount, 2) // should have returned early when the right key was found
  })

  t.test('signer.unsign failure response', (t) => {
    t.plan(4)

    const input = sign('some-value', 'invalid-secret')
    signSpy.resetHistory()
    const result = signer.unsign(input)

    t.equal(result.valid, false)
    t.equal(result.renew, false)
    t.equal(result.value, null)
    t.equal(signSpy.callCount, 3) // should have tried all 3
  })
})

test('Signer', t => {
  t.plan(2)

  t.test('Signer needs a string or Buffer as secret', (t) => {
    t.plan(6)
    t.throws(() => Signer(1), 'Secret key must be a string or Buffer.')
    t.throws(() => Signer(undefined), 'Secret key must be a string or Buffer.')
    t.doesNotThrow(() => Signer('secret'))
    t.doesNotThrow(() => Signer(['secret']))
    t.doesNotThrow(() => Signer(Buffer.from('deadbeef76543210', 'hex')))
    t.doesNotThrow(() => Signer([Buffer.from('deadbeef76543210', 'hex')]))
  })

  t.test('Signer handles algorithm properly', (t) => {
    t.plan(3)
    t.throws(() => Signer('secret', 'invalid'), 'Algorithm invalid not supported.')
    t.doesNotThrow(() => Signer('secret', 'sha512'))
    t.doesNotThrow(() => Signer('secret', 'sha256'))
  })
})
