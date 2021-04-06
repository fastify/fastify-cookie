'use strict'

const { test } = require('tap')
const sinon = require('sinon')
const cookieSignature = require('cookie-signature')
const signerFactory = require('../signer')

test('default', (t) => {
  t.plan(2)

  const secret = 'my-secret'
  const signer = signerFactory(secret)

  t.test('signer.sign', (t) => {
    t.plan(1)

    const input = 'some-value'
    const result = signer.sign(input)

    t.equal(result, cookieSignature.sign(input, secret))
  })

  t.test('signer.unsign', (t) => {
    t.plan(3)

    const input = cookieSignature.sign('some-value', secret)
    const result = signer.unsign(input)

    t.equal(result.valid, true)
    t.equal(result.renew, false)
    t.equal(result.value, 'some-value')
  })
})

test('key rotation', (t) => {
  t.plan(3)
  const secret1 = 'my-secret-1'
  const secret2 = 'my-secret-2'
  const secret3 = 'my-secret-3'
  const signer = signerFactory([secret1, secret2, secret3])
  const unsignSpy = sinon.spy(cookieSignature, 'unsign')

  t.beforeEach(() => {
    unsignSpy.resetHistory()
  })

  t.test('signer.sign always signs using first key', (t) => {
    t.plan(1)

    const input = 'some-value'
    const result = signer.sign(input)

    t.equal(result, cookieSignature.sign(input, secret1))
  })

  t.test('signer.unsign tries to decode using all keys till it finds', (t) => {
    t.plan(4)

    const input = cookieSignature.sign('some-value', secret2)
    const result = signer.unsign(input)

    t.equal(result.valid, true)
    t.equal(result.renew, true)
    t.equal(result.value, 'some-value')
    t.equal(unsignSpy.callCount, 2) // should have returned early when the right key was found
  })

  t.test('signer.unsign failure response', (t) => {
    t.plan(4)

    const input = cookieSignature.sign('some-value', 'invalid-secret')
    const result = signer.unsign(input)

    t.equal(result.valid, false)
    t.equal(result.renew, false)
    t.equal(result.value, null)
    t.equal(unsignSpy.callCount, 3) // should have tried all 3
  })
})
