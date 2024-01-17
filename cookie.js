/*!
 * Adapted from https://github.com/jshttp/cookie
 *
 * (The MIT License)
 *
 * Copyright (c) 2012-2014 Roman Shtylman <shtylman@gmail.com>
 * Copyright (c) 2015 Douglas Christopher Wilson <doug@somethingdoug.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * 'Software'), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

'use strict'

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
 * @param {object} [opt]
 * @return {object}
 * @public
 */

function parse (str, opt) {
  if (typeof str !== 'string') {
    throw new TypeError('argument str must be a string')
  }

  const dec = opt?.decode || decodeURIComponent
  const result = {}

  const strLen = str.length
  let pos = 0
  let terminatorPos = 0
  while (true) {
    if (terminatorPos === strLen) break
    terminatorPos = str.indexOf(';', pos)
    if (terminatorPos === -1) terminatorPos = strLen // This is the last pair

    let eqIdx = str.indexOf('=', pos)
    if (eqIdx === -1) break // No key-value pairs left
    if (eqIdx > terminatorPos) {
      // Malformed key-value pair
      pos = terminatorPos + 1
      continue
    }

    const key = str.substring(pos, eqIdx++).trim()
    if (result[key] === undefined) {
      const val = str.charCodeAt(eqIdx) === 0x22
        ? str.substring(eqIdx + 1, terminatorPos - 1).trim()
        : str.substring(eqIdx, terminatorPos).trim()

      result[key] = !(dec === decodeURIComponent && val.indexOf('%') === -1)
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
 * @param {object} [opt]
 * @return {string}
 * @public
 */

function serialize (name, val, opt) {
  const enc = opt?.encode || encodeURIComponent
  if (typeof enc !== 'function') {
    throw new TypeError('option encode is invalid')
  }

  if (name && !fieldContentRegExp.test(name)) {
    throw new TypeError('argument name is invalid')
  }

  const value = enc(val)
  if (value && !fieldContentRegExp.test(value)) {
    throw new TypeError('argument val is invalid')
  }

  let str = name + '=' + value

  if (opt == null) return str

  if (opt.maxAge != null) {
    const maxAge = +opt.maxAge

    if (!isFinite(maxAge)) {
      throw new TypeError('option maxAge is invalid')
    }

    str += '; Max-Age=' + Math.trunc(maxAge)
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

  if (opt.priority) {
    const priority = typeof opt.priority === 'string'
      ? opt.priority.toLowerCase()
      : opt.priority

    switch (priority) {
      case 'low':
        str += '; Priority=Low'
        break
      case 'medium':
        str += '; Priority=Medium'
        break
      case 'high':
        str += '; Priority=High'
        break
      default:
        throw new TypeError('option priority is invalid')
    }
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

  // Draft implementation to support Chrome from 2024-Q1 forward.
  // See https://datatracker.ietf.org/doc/html/draft-cutler-httpbis-partitioned-cookies#section-2.1
  if (opt.partitioned) {
    str += '; Partitioned'
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
 * @returns {string}
 * @private
 */
function tryDecode (str, decode) {
  try {
    return decode(str)
  } catch {
    return str
  }
}

/**
 * Module exports.
 * @public
 */

module.exports = {
  parse,
  serialize
}
