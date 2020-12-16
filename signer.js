'use strict'

const cookieSignature = require('cookie-signature')

module.exports = function (secret) {
  const secrets = Array.isArray(secret) ? secret : [secret]
  const [signingKey] = secrets

  return {
    sign (value) {
      return cookieSignature.sign(value, signingKey)
    },
    unsign (signedValue) {
      let valid = false
      let renew = false
      let value = null

      for (const key of secrets) {
        const result = cookieSignature.unsign(signedValue, key)

        if (result !== false) {
          valid = true
          renew = key !== signingKey
          value = result
          break
        }
      }

      return { valid, renew, value }
    }
  }
}
