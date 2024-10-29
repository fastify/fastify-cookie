'use strict'

const { beforeEach, describe, test } = require('node:test')
const assert = require('node:assert/strict')
const sinon = require('sinon')
const crypto = require('node:crypto')

const { Signer, sign, unsign } = require('../signer')

describe('default', () => {
  const secret = 'my-secret'
  const signer = Signer(secret)

  test('signer.sign should throw if there is no value provided', () => {
    assert.throws(() => signer.sign(undefined), err => err.message === 'Cookie value must be provided as a string.')
  })

  test('sign', () => {
    const input = 'some-value'
    const result = signer.sign(input)

    assert.strictEqual(result, sign(input, secret))
    assert.strictEqual(result, sign(input, [secret]))
    assert.strictEqual(result, sign(input, Buffer.from(secret)))
    assert.strictEqual(result, sign(input, [Buffer.from(secret)]))

    assert.throws(() => sign(undefined), err => err.message === 'Secret key must be a string or Buffer.')
  })

  test('signer.unsign', () => {
    const input = signer.sign('some-value', secret)
    const result = signer.unsign(input)

    assert.strictEqual(result.valid, true)
    assert.strictEqual(result.renew, false)
    assert.strictEqual(result.value, 'some-value')
    assert.throws(() => signer.unsign(undefined), err => err.message === 'Signed cookie string must be provided.')
  })

  test('unsign', () => {
    const input = sign('some-value', secret)
    const result = unsign(input, secret)

    assert.strictEqual(result.valid, true)
    assert.strictEqual(result.renew, false)
    assert.strictEqual(result.value, 'some-value')
    assert.deepStrictEqual(result, unsign(input, [secret]))
    assert.throws(() => unsign(undefined), err => err.message === 'Secret key must be a string or Buffer.')
    assert.throws(() => unsign(undefined, secret), err => err.message === 'Signed cookie string must be provided.')
  })
})

describe('key rotation', () => {
  const secret1 = 'my-secret-1'
  const secret2 = 'my-secret-2'
  const secret3 = 'my-secret-3'
  const signer = Signer([secret1, secret2, secret3])
  const signSpy = sinon.spy(crypto, 'createHmac')

  beforeEach(() => {
    signSpy.resetHistory()
  })

  test('signer.sign always signs using first key', () => {
    const input = 'some-value'
    const result = signer.sign(input)

    assert.strictEqual(result, sign(input, secret1))
  })

  test('signer.unsign tries to decode using all keys till it finds', () => {
    const input = sign('some-value', secret2)
    signSpy.resetHistory()
    const result = signer.unsign(input)

    assert.strictEqual(result.valid, true)
    assert.strictEqual(result.renew, true)
    assert.strictEqual(result.value, 'some-value')
    assert.strictEqual(signSpy.callCount, 2) // should have returned early when the right key was found
  })

  test('signer.unsign failure response', () => {
    const input = sign('some-value', 'invalid-secret')
    signSpy.resetHistory()
    const result = signer.unsign(input)

    assert.strictEqual(result.valid, false)
    assert.strictEqual(result.renew, false)
    assert.strictEqual(result.value, null)
    assert.strictEqual(signSpy.callCount, 3) // should have tried all 3
  })
})

describe('Signer', () => {
  test('Signer needs a string or Buffer as secret', () => {
    assert.throws(() => Signer(1), err => err.message === 'Secret key must be a string or Buffer.')
    assert.throws(() => Signer(undefined), err => err.message === 'Secret key must be a string or Buffer.')
    assert.doesNotThrow(() => Signer('secret'))
    assert.doesNotThrow(() => Signer(['secret']))
    assert.doesNotThrow(() => Signer(Buffer.from('deadbeef76543210', 'hex')))
    assert.doesNotThrow(() => Signer([Buffer.from('deadbeef76543210', 'hex')]))
  })

  test('Signer handles algorithm properly', () => {
    assert.throws(() => Signer('secret', 'invalid'), err => err.message === 'Algorithm invalid not supported.')
    assert.doesNotThrow(() => Signer('secret', 'sha512'))
    assert.doesNotThrow(() => Signer('secret', 'sha256'))
  })
})
