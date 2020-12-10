const cookieSignature = require('cookie-signature')

module.exports = function (secret) {
  const sign = (value) => {
    return cookieSignature.sign(value, secret)
  }

  const unsign = (value) => {
    return cookieSignature.unsign(value, secret)
  }

  return { sign, unsign }
}
