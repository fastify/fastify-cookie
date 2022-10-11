'use strict'

const crypto = require('crypto')
const defaultAlgorithm = 'aes256'
const defaultEncoding = 'base64'

function Encrypter (key, algorithm, encoding) {
  this.key = key
  this.algorithm = algorithm || defaultAlgorithm
  this.encoding = encoding || defaultEncoding

  checkProps(this.key, this.algorithm)
}

Encrypter.prototype.encrypt = function (value) {
  return encrypt(value, this.key, this.algorithm, this.encoding)
}

Encrypter.prototype.decrypt = function (value) {
  return decrypt(value, this.key, this.algorithm, this.encoding)
}

function encrypt (str, key, algorithm, encoding) {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(
    algorithm,
    key,
    iv
  )

  const encrypted = `${iv.toString(encoding)}:${cipher.update(str, 'utf-8', encoding) + cipher.final(encoding)}`
  return encrypted
}

function decrypt (str, key, algorithm, encoding) {
  const encryptedArray = str.split(':')
  const iv = Buffer.from(encryptedArray[0], encoding)
  const encrypted = Buffer.from(encryptedArray[1], encoding)
  const decipher = crypto.createDecipheriv(algorithm, key, iv)

  const decrypted = decipher.update(encrypted, encoding, 'utf-8') + decipher.final('utf-8')
  return decrypted
}

function checkProps (key, algorithm) {
  if (!key) {
    throw new TypeError('A key has to be supplied.')
  }

  if (algorithm === 'aes256' && key.length !== 32) {
    throw new Error('A 32-byte key must be used with aes256.')
  }
}

module.exports = Encrypter
