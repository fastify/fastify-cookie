/*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Module exports.
 * @public
 */

exports.parse = parse
exports.serialize = serialize

/**
 * Module variables.
 * @private
 */

const decode = decodeURIComponent
const encode = encodeURIComponent

/**
 * RegExp to match field-content in RFC 7230 sec 3.2
 *
 * field-content = field-vchar [ 1*( SP / HTAB ) field-vchar ]
 * field-vchar   = VCHAR / obs-text
 * obs-text      = %x80-FF
 */

const fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/ // eslint-disable-line

/**
 * Parse a cookie header.
 *
 * Parse the given cookie header string into an object
 * The object has the various cookies as keys(names) => values
 *
 * @param {string} str
 * @param {object} [options]
 * @return {object}
 * @public
 */

function parse (str, options) {
  if (typeof str !== 'string') {
    throw new TypeError('argument str must be a string')
  }

  const result = {}
  const dec = (options && options.decode) || decode

  let pos = 0
  let terminatorPos = 0
  let eqIdx = 0

  while (true) {
    if (terminatorPos === str.length) {
      break
    }
    terminatorPos = str.indexOf(';', pos)
    terminatorPos = (terminatorPos === -1) ? str.length : terminatorPos
    eqIdx = str.indexOf('=', pos)

    // skip things that don't look like key=value
    if (eqIdx === -1 || eqIdx > terminatorPos) {
      pos = terminatorPos + 1
      continue
    }

    const key = str.substring(pos, eqIdx++).trim()

    // only assign once
    if (undefined === result[key]) {
      const val = (str.charCodeAt(eqIdx) === 0x22)
        ? str.substring(eqIdx + 1, terminatorPos - 1).trim()
        : str.substring(eqIdx, terminatorPos).trim()

      result[key] = (dec !== decode || val.indexOf('%') !== -1)
        ? tryDecode(val, dec)
        : val
    }
    pos = terminatorPos + 1
  }
  return result
}

/**
 * Serialize data into a cookie header.
 *
 * Serialize the a name value pair into a cookie string suitable for
 * http headers. An optional options object specified cookie parameters.
 *
 * serialize('foo', 'bar', { httpOnly: true })
 *   => "foo=bar; httpOnly"
 *
 * @param {string} name
 * @param {string} val
 * @param {object} [options]
 * @return {string}
 * @public
 */

function serialize (name, val, options) {
  const opt = options || {}
  const enc = opt.encode || encode
  if (typeof enc !== 'function') {
    throw new TypeError('option encode is invalid')
  }

  if (!fieldContentRegExp.test(name)) {
    throw new TypeError('argument name is invalid')
  }

  const value = enc(val)
  if (value && !fieldContentRegExp.test(value)) {
    throw new TypeError('argument val is invalid')
  }

  let str = name + '=' + value
  if (opt.maxAge != null) {
    const maxAge = opt.maxAge - 0
    if (isNaN(maxAge) || !isFinite(maxAge)) {
      throw new TypeError('option maxAge is invalid')
    }

    str += '; Max-Age=' + Math.floor(maxAge)
  }

  if (opt.domain) {
    if (!fieldContentRegExp.test(opt.domain)) {
      throw new TypeError('option domain is invalid')
    }

    str += '; Domain=' + opt.domain
  }

  if (opt.path) {
    if (!fieldContentRegExp.test(opt.path)) {
      throw new TypeError('option path is invalid')
    }

    str += '; Path=' + opt.path
  }

  if (opt.expires) {
    if (typeof opt.expires.toUTCString !== 'function') {
      throw new TypeError('option expires is invalid')
    }

    str += '; Expires=' + opt.expires.toUTCString()
  }

  if (opt.httpOnly) {
    str += '; HttpOnly'
  }

  if (opt.secure) {
    str += '; Secure'
  }

  if (opt.sameSite) {
    const sameSite = typeof opt.sameSite === 'string'
      ? opt.sameSite.toLowerCase()
      : opt.sameSite
    switch (sameSite) {
      case true:
        str += '; SameSite=Strict'
        break
      case 'lax':
        str += '; SameSite=Lax'
        break
      case 'strict':
        str += '; SameSite=Strict'
        break
      case 'none':
        str += '; SameSite=None'
        break
      default:
        throw new TypeError('option sameSite is invalid')
    }
  }

  return str
}

/**
 * Try decoding a string using a decoding function.
 *
 * @param {string} str
 * @param {function} decode
 * @private
 */

function tryDecode (str, decode) {
  try {
    return decode(str)
  } catch (e) {
    return str
  }
}
