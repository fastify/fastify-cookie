'use strict'

const tap = require('tap')
const test = tap.test
const crypto = require('crypto')
const Encrypter = require('../encrypter')

test('default', (t) => {
  t.plan(2)

  const key = crypto.randomBytes(32)
  const encrypter = new Encrypter(key)

  t.test('encrypt should throw if there is no value provided', (t) => {
    t.plan(1)

    t.throws(() => encrypter.encrypt(undefined), 'Cookie value must be provided as a string.')
  })

  t.test('different results', (t) => {
    t.plan(1)

    const encrypt = encrypter.encrypt('test!')

    t.equal(encrypter.decrypt(encrypt), 'test!')
  })
})

test('wrong algorithm parameters', (t) => {
  t.plan(2)

  t.test('aes and wrong byte number', (t) => {
    t.plan(1)

    const key = crypto.randomBytes(5)

    t.throws(() => new Encrypter(key), 'Key must be 32 bytes for AES256.')
  })

  t.test('undefined key', (t) => {
    t.plan(1)

    const key = undefined

    t.throws(() => new Encrypter(key), 'Key must be supplied.')
  })
})
