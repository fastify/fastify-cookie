'use strict'

const crypto = require('crypto')

function SignerFactory (secret, algorithm = 'sha256') {
  if (!(this instanceof SignerFactory)) {
    return new SignerFactory(secret, algorithm)
  }

  this.secrets = Array.isArray(secret) ? secret : [secret]
  this.signingKey = this.secrets[0]
  this.algorithm = algorithm

  validateSecrets(this.secrets)
  validateAlgorithm(this.algorithm)
}

function validateSecrets (secrets) {
  for (const secret of secrets) {
    if (typeof secret !== 'string') {
      throw new TypeError('Secret key must be a string.')
    }
  }
}

function validateAlgorithm (algorithm) {
  // validate that the algorithm is supported by the node runtime
  try {
    crypto.createHmac(algorithm, 'dummyHmac')
  } catch (e) {
    throw new TypeError(`Algorithm ${algorithm} not supported.`)
  }
}

SignerFactory.prototype.sign = function (value, secret = this.signingKey, algorithm = this.algorithm) {
  if (typeof value !== 'string') {
    throw new TypeError('Cookie value must be provided as a string.')
  }
  return value + '.' + crypto
    .createHmac(algorithm, secret)
    .update(value)
    .digest('base64')
    // remove base64 padding (=) as it has special meaning in cookies
    .replace(/=+$/, '')
}

SignerFactory.prototype.unsign = function (signedValue, secrets = this.secrets, algorithm = this.algorithm) {
  if (typeof signedValue !== 'string') {
    throw new TypeError('Signed cookie string must be provided.')
  }
  const value = signedValue.slice(0, signedValue.lastIndexOf('.'))
  const actual = Buffer.from(signedValue)

  for (const secret of secrets) {
    const expected = Buffer.from(this.sign(value, secret, algorithm))
    if (
      expected.length === actual.length &&
      crypto.timingSafeEqual(expected, actual)
    ) {
      return {
        valid: true,
        renew: secret !== secrets[0],
        value
      }
    }
  }

  return {
    valid: false,
    renew: false,
    value: null
  }
}

// create a signer-instance, with dummy secret
const signer = new SignerFactory(['dummy'])

function sign (value, secret, algorithm = 'sha256') {
  const secrets = Array.isArray(secret) ? secret : [secret]

  validateSecrets(secrets)

  return signer.sign(value, secrets[0], algorithm)
}

function unsign (signedValue, secret, algorithm = 'sha256') {
  const secrets = Array.isArray(secret) ? secret : [secret]

  validateSecrets(secrets)

  return signer.unsign(signedValue, secrets, algorithm)
}
module.exports = SignerFactory
module.exports.signerFactory = SignerFactory
module.exports.sign = sign
module.exports.unsign = unsign
