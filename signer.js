'use strict'

const cookieSignature = require('cookie-signature')

module.exports = function (secret) {
  return {
    sign (value) {
      return cookieSignature.sign(value, secret)
    },
    unsign (value) {
      return cookieSignature.unsign(value, secret)
    }
  }
}
