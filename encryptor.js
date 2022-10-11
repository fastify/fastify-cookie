'use strict'

const crypto = require('crypto')
const defaultAlgorithm = 'aes256'
const defaultEncoding = 'base64'

function Encryptor (key) {
  this.key = key || crypto.randomBytes(32)
}

Encryptor.prototype.encrypt = function (value) {
  return encrypt(value, this.key)
}

Encryptor.prototype.decrypt = function (value) {
  return decrypt(value, this.key)
}

function encrypt (str, key) {
  const algorithm = defaultAlgorithm

  checkProps(algorithm, key)

  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(
    algorithm,
    key,
    iv
  )

  const encrypted = `${iv.toString(defaultEncoding)}:${cipher.update(str, 'utf-8', defaultEncoding) + cipher.final(defaultEncoding)}`
  return encrypted
}

function decrypt (str, key) {
  const algorithm = defaultAlgorithm

  checkProps(algorithm, key)

  const encryptedArray = str.split(':')
  const iv = Buffer.from(encryptedArray[0], defaultEncoding)
  const encrypted = Buffer.from(encryptedArray[1], defaultEncoding)
  const decipher = crypto.createDecipheriv(algorithm, key, iv)

  const decrypted = decipher.update(encrypted, defaultEncoding, 'utf-8') + decipher.final('utf-8')
  return decrypted
}

function checkProps (algorithm, key) {
  if (!key) {
    throw new TypeError('A key has to be supplied.')
  }

  if (algorithm === 'aes256' && key.length !== 32) {
    throw new Error('A 32-byte key must be used with aes256.')
  }
}

module.exports = { Encryptor, encrypt, decrypt }
