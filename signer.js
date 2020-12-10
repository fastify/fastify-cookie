'use strict'

const cookieSignature = require('cookie-signature')

module.exports = function (secret) {
  return {
    sign: value => cookieSignature.sign(value, secret),
    unsign: value => cookieSignature.unsign(value, secret)
  }
}
