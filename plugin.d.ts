/// <reference types="node" />

import { FastifyPlugin } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    /**
     * Request cookies
     */
    cookies: { [cookieName: string]: string };
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
    ): string | false;
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
  secret?: string;
}

declare const fastifyCookie: FastifyPlugin<FastifyCookieOptions>;

export default fastifyCookie;
