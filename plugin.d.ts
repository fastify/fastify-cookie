/// <reference types='node' />

import { FastifyPluginCallback } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    /**
     * Unsigns the specified cookie using the secret provided.
     * @param value Cookie value
     */
    unsignCookie(value: string): {
      valid: boolean;
      renew: boolean;
      value: string | null;
    };
    /**
     * Manual cookie parsing method
     * @docs https://github.com/fastify/fastify-cookie#manual-cookie-parsing
     * @param cookieHeader Raw cookie header value
     */
    parseCookie(cookieHeader: string): {
      [key: string]: string;
    };
  }

  interface FastifyRequest {
    /**
     * Request cookies
     */
    cookies: { [cookieName: string]: string };

    /**
     * Unsigns the specified cookie using the secret provided.
     * @param value Cookie value
     */
    unsignCookie(value: string): {
      valid: boolean;
      renew: boolean;
      value: string | null;
    };
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
    unsignCookie(value: string): {
      valid: boolean;
      renew: boolean;
      value: string | null;
    };
  }
}

export interface CookieSerializeOptions {
  domain?: string;
  encode?(val: string): string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: boolean | 'lax' | 'strict' | 'none';
  secure?: boolean;
  signed?: boolean;
}

interface Signer {
  sign: (input: string) => string;
  unsign: (input: string) => {
    valid: boolean;
    renew: boolean;
    value: string | null;
  };
}

export interface FastifyCookieOptions {
  secret?: string | string[] | Signer;
  parseOptions?: CookieSerializeOptions;
}

declare const fastifyCookie: FastifyPluginCallback<NonNullable<FastifyCookieOptions>>;

export default fastifyCookie;
export { fastifyCookie };
