/// <reference types='node' />

import { FastifyPluginCallback } from "fastify";

declare module "fastify" {
  interface FastifyInstance extends SignerMethods {
    /**
     * Serialize a cookie name-value pair into a Set-Cookie header string
     * @param name Cookie name
     * @param value Cookie value
     * @param opts Options
     * @throws {TypeError} When maxAge option is invalid
     */
    serializeCookie(name: string, value: string, opts?: fastifyCookie.SerializeOptions): string;

    /**
     * Manual cookie parsing method
     * @docs https://github.com/fastify/fastify-cookie#manual-cookie-parsing
     * @param cookieHeader Raw cookie header value
     */
    parseCookie(cookieHeader: string): {
      [key: string]: string;
    };
  }

  interface FastifyRequest extends SignerMethods {
    /**
     * Request cookies
     */
    cookies: { [cookieName: string]: string | undefined };
  }

  interface FastifyReply extends SignerMethods {
    /**
     * Request cookies
     */
    cookies: { [cookieName: string]: string | undefined };
  }

  interface SignerMethods {
    /**
     * Signs the specified cookie using the secret/signer provided.
     * @param value cookie value
     */
     signCookie(value: string): string;

    /**
     * Unsigns the specified cookie using the secret/signer provided.
     * @param value Cookie value
     */
    unsignCookie(value: string): fastifyCookie.UnsignResult;
  }

  export type setCookieWrapper = (
    name: string,
    value: string,
    options?: fastifyCookie.CookieSerializeOptions
  ) => FastifyReply;

  interface FastifyReply {
    /**
     * Set response cookie
     * @name setCookie
     * @param name Cookie name
     * @param value Cookie value
     * @param options Serialize options
     */
    setCookie: setCookieWrapper;

    /**
     * @alias setCookie
     */
    cookie(
      name: string,
      value: string,
      options?: fastifyCookie.CookieSerializeOptions
    ): this;

    /**
     * clear response cookie
     * @param name Cookie name
     * @param options Serialize options
     */
    clearCookie(
      name: string,
      options?: fastifyCookie.CookieSerializeOptions
    ): this;

    /**
     * Unsigns the specified cookie using the secret provided.
     * @param value Cookie value
     */
    unsignCookie(value: string): fastifyCookie.UnsignResult;
  }
}

type FastifyCookiePlugin = FastifyPluginCallback<
  NonNullable<fastifyCookie.FastifyCookieOptions>
>;

declare namespace fastifyCookie {
  interface SignerBase {
    sign: (value: string) => string;
    unsign: (input: string) => UnsignResult;
  }

  export class Signer implements SignerBase {
    constructor (secrets: string | Array<string> | Buffer | Array<Buffer>, algorithm?: string)
    sign: (value: string) => string;
    unsign: (input: string) => UnsignResult;
  }

  export interface SerializeOptions {
    /**  The `Domain` attribute. */
    domain?: string;
    /** Specifies a function that will be used to encode a cookie's value. Since value of a cookie has a limited character set (and must be a simple string), this function can be used to encode a value into a string suited for a cookie's value. */
    encode?(val: string): string;
    /** The expiration `date` used for the `Expires` attribute. If both `expires` and `maxAge` are set, then `expires` is used. */
    expires?: Date;
    /** The `boolean` value of the `HttpOnly` attribute. Defaults to true. */
    httpOnly?: boolean;
    /** A `number` in seconds that specifies the `Expires` attribute by adding the specified seconds to the current date. If both `expires` and `maxAge` are set, then `expires` is used. */
    maxAge?: number;
    /** A `boolean` indicating whether the cookie is tied to the top-level site where it's initially set and cannot be accessed from elsewhere. */
    partitioned?: boolean;
    /** The `Path` attribute. Defaults to `/` (the root path).  */
    path?: string;
    /** A `boolean` or one of the `SameSite` string attributes. E.g.: `lax`, `none` or `strict`.  */
    sameSite?: 'lax' | 'none' | 'strict' | boolean;
    /** One of the `Priority` string attributes (`low`, `medium` or `high`) specifying a retention priority for HTTP cookies that will be respected by user agents during cookie eviction. */
    priority?: 'low' | 'medium' | 'high';
    /** The `boolean` value of the `Secure` attribute. Set this option to false when communicating over an unencrypted (HTTP) connection. Value can be set to `auto`; in this case the `Secure` attribute will be set to false for HTTP request, in case of HTTPS it will be set to true.  Defaults to true. */
    secure?: boolean;
  }

  export interface CookieSerializeOptions extends Omit<SerializeOptions, 'secure'> {
    secure?: boolean | 'auto';
    signed?: boolean;
  }

  export interface ParseOptions {
    decode?: (encodedURIComponent: string) => string;
  }

  type HookType = 'onRequest' | 'preParsing' | 'preValidation' | 'preHandler'  | 'preSerialization';

  export interface FastifyCookieOptions {
    secret?: string | string[] | Buffer | Buffer[] | Signer;
    hook?: HookType | false;
    parseOptions?: fastifyCookie.CookieSerializeOptions;
  }

  export type Sign = (value: string, secret: string | Buffer, algorithm?: string) => string;
  export type Unsign = (input: string, secret: string | Buffer, algorithm?: string) => UnsignResult;
  export type SignerFactory = (secrets: string | string[] | Buffer | Buffer[], algorithm?: string) => SignerBase;

  export interface UnsignResult {
    valid: boolean;
    renew: boolean;
    value: string | null;
  }

  export const signerFactory: SignerFactory;
  export const sign: Sign;
  export const unsign: Unsign;

  export interface FastifyCookie extends FastifyCookiePlugin {
    parse: (cookieHeader: string, opts?: ParseOptions) => { [key: string]: string };
    serialize: (name: string, value: string, opts?: SerializeOptions) => string;
    signerFactory: SignerFactory;
    Signer: Signer;
    sign: Sign;
    unsign: Unsign;
  }

  export const fastifyCookie: FastifyCookie;

  export interface FastifyCookieOptions {
    secret?: string | string[] | Buffer | Buffer[] | SignerBase;
    algorithm?: string;
    parseOptions?: CookieSerializeOptions;
  }

  export { fastifyCookie as default };
}

declare function fastifyCookie(
  ...params: Parameters<FastifyCookiePlugin>
): ReturnType<FastifyCookiePlugin>;

export = fastifyCookie;
