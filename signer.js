'use strict'

const crypto = require('crypto')

function signerFactory (secret, factoryAlgorithm = 'sha256') {
  const secrets = Array.isArray(secret) ? secret : [secret]

  for (const secret of secrets) {
    if (typeof secret !== 'string') {
      throw new TypeError('Secret key must be a string.')
    }
  }

  const signingKey = secrets[0]

  // validate that the algorithm is supported by the node runtime
  try {
    crypto.createHmac(factoryAlgorithm, signingKey)
  } catch (e) {
    throw new TypeError(`Algorithm ${factoryAlgorithm} not supported.`)
  }

  return {
    sign (value, secret = signingKey, algorithm = factoryAlgorithm) {
      if (typeof value !== 'string') {
        throw new TypeError('Cookie value must be provided as a string.')
      }
      return value + '.' + crypto
        .createHmac(algorithm, secret)
        .update(value)
        .digest('base64')
        // remove base64 padding (=) as it has special meaning in cookies
        .replace(/=+$/, '')
    },
    unsign (signedValue, keys = secrets, algorithm = factoryAlgorithm) {
      if (typeof signedValue !== 'string') {
        throw new TypeError('Signed cookie string must be provided.')
      }
      const value = signedValue.slice(0, signedValue.lastIndexOf('.'))
      const actual = Buffer.from(signedValue)

      for (const key of keys) {
        const expected = Buffer.from(this.sign(value, key, algorithm))
        if (
          expected.length === actual.length &&
          crypto.timingSafeEqual(expected, actual)
        ) {
          return {
            valid: true,
            renew: key !== keys[0],
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
  }
}

// create a signer-instance, with dummy secret, as the secret is validated by
// the sign and unsign functions
const signer = signerFactory(['dummy'])

module.exports = signerFactory
module.exports.signerFactory = signerFactory
module.exports.sign = function sign (value, secret, algorithm = 'sha256') {
  const secrets = Array.isArray(secret) ? secret : [secret]

  for (const secret of secrets) {
    if (typeof secret !== 'string') {
      throw new TypeError('Secret key must be a string.')
    }
  }

  return signer.sign(value, secrets[0], algorithm)
}
module.exports.unsign = function unsign (signedValue, secret, algorithm = 'sha256') {
  const secrets = Array.isArray(secret) ? secret : [secret]

  for (const secret of secrets) {
    if (typeof secret !== 'string') {
      throw new TypeError('Secret key must be a string.')
    }
  }

  return signer.unsign(signedValue, secrets, algorithm)
}
