'use strict'

const tap = require('tap')
const test = tap.test
const cookieSignature = require('cookie-signature')
const signerFactory = require('../signer')

const secret = 'my-secret'
const signer = signerFactory(secret)

test('signer.sign', (t) => {
  t.plan(1)

  const input = 'some-value'
  const result = signer.sign(input)

  t.is(result, cookieSignature.sign(input, secret))
})

test('signer.unsign', (t) => {
  t.plan(1)

  const input = cookieSignature.sign('some-value', secret)
  const result = signer.unsign(input)

  t.is(result, 'some-value')
})
