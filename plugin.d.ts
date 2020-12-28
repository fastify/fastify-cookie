/// <reference types="node" />

import { FastifyPluginCallback } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    /**
     * Request cookies
     */
    cookies: { [cookieName: string]: string };

    /**
     * Unsigns the specified cookie using the secret provided.
     * @param value Cookie value
     */
    unsignCookie(
      value: string,
    ): {
      valid: boolean;
      renew: boolean;
      value: string | null;
    };
  }

  interface FastifyReply {
    /**
     * Set response cookie
     * @param name Cookie name
     * @param value Cookie value
     * @param options Serialize options
     */
    setCookie(
      name: string,
      value: string,
      options?: CookieSerializeOptions
    ): FastifyReply;

    /**
     * clear response cookie
     * @param name Cookie name
     * @param options Serialize options
     */
    clearCookie(
      name: string,
      options?: CookieSerializeOptions
    ): FastifyReply;

    /**
     * Unsigns the specified cookie using the secret provided.
     * @param value Cookie value
     */
    unsignCookie(
      value: string,
    ): {
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

export interface FastifyCookieOptions {
  secret?: string | string[];
}

declare const fastifyCookie: FastifyPluginCallback<NonNullable<FastifyCookieOptions>>;

export default fastifyCookie;
export { fastifyCookie }
