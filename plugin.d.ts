/// <reference types='node' />

import { FastifyPluginCallback } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    /**
     * Unsigns the specified cookie using the secret provided.
     * @param value Cookie value
     */
    unsignCookie(value: string): UnsignResult;
    /**
     * Manual cookie parsing method
     * @docs https://github.com/fastify/fastify-cookie#manual-cookie-parsing
     * @param cookieHeader Raw cookie header value
     */
    parseCookie(cookieHeader: string): {
      [key: string]: string;
    };
    /**
     * Manual cookie signing method
     * @docs https://github.com/fastify/fastify-cookie#manual-cookie-parsing
     * @param value cookie value
     */
    signCookie(value: string): string;
  }

  interface FastifyRequest {
    /**
     * Request cookies
     */
    cookies: { [cookieName: string]: string | undefined };

    /**
     * Unsigns the specified cookie using the secret provided.
     * @param value Cookie value
     */
    unsignCookie(value: string): UnsignResult;
  }

  export type setCookieWrapper = (
    name: string,
    value: string,
    options?: CookieSerializeOptions
  ) => FastifyReply;

  interface FastifyReply {
    /**
     * Set response cookie
     * @name setCookie
     * @param name Cookie name
     * @param value Cookie value
     * @param options Serialize options
     */
    setCookie(
      name: string,
      value: string,
      options?: CookieSerializeOptions
    ): this;

    /**
     * @alias setCookie
     */
    cookie(name: string, value: string, options?: CookieSerializeOptions): this;

    /**
     * clear response cookie
     * @param name Cookie name
     * @param options Serialize options
     */
    clearCookie(name: string, options?: CookieSerializeOptions): this;

    /**
     * Unsigns the specified cookie using the secret provided.
     * @param value Cookie value
     */
    unsignCookie(value: string): UnsignResult;
  }
}

export interface CookieSerializeOptions {
  domain?: string;
  encode?(val: string): string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  priority?: 'low' | 'medium' | 'high';
  sameSite?: boolean | 'lax' | 'strict' | 'none';
  secure?: boolean;
  signed?: boolean;
}

type UnsignResult = {
  valid: boolean;
  renew: boolean;
  value: string | null;
};

interface Signer {
  sign: (input: string) => string;
  unsign: (input: string) => UnsignResult;
}

declare class Signer {
  constructor (secrets: string | Array<string>, algorithm?: string)
  sign: (value: string) => string;
  unsign: (input: string) => UnsignResult;
}

declare const sign: (value: string, secret: string, algorithm?: string) => string;
declare const unsign: (input: string, secret: string, algorithm?: string) => UnsignResult;

export interface FastifyCookieOptions {
  secret?: string | string[] | Signer;
  algorithm?: string;
  parseOptions?: CookieSerializeOptions;
}

export type Sign  = (value: string, secret: string) => string;
export type Unsign  = (input: string, secret: string) => string | false;
export type SignerFactory = (secret: string) => Signer;

export interface FastifyCookie extends FastifyPluginCallback<NonNullable<FastifyCookieOptions>>{
  signerFactory: SignerFactory;
  sign: Sign;
  unsign: Unsign;
}

declare const fastifyCookie: FastifyCookie;

export default fastifyCookie;
export { fastifyCookie, Signer, sign, unsign };
