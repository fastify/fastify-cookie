/// <reference types='node' />

import { FastifyPluginCallback } from "fastify";

declare module "fastify" {
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
    unsignCookie(value: string): {
      valid: boolean;
      renew: boolean;
      value: string | null;
    };
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
    setCookie(
      name: string,
      value: string,
      options?: fastifyCookie.CookieSerializeOptions
    ): this;

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
    unsignCookie(value: string): {
      valid: boolean;
      renew: boolean;
      value: string | null;
    };
  }
}

type FastifyCookiePlugin = FastifyPluginCallback<
  NonNullable<fastifyCookie.FastifyCookieOptions>
>;

declare namespace fastifyCookie {
  export interface Signer {
    sign: (input: string) => string;
    unsign: (input: string) => {
      valid: boolean;
      renew: boolean;
      value: string | null;
    };
  }

  export interface CookieSerializeOptions {
    domain?: string;
    encode?(val: string): string;
    expires?: Date;
    httpOnly?: boolean;
    maxAge?: number;
    path?: string;
    priority?: "low" | "medium" | "high";
    sameSite?: boolean | "lax" | "strict" | "none";
    secure?: boolean;
    signed?: boolean;
  }

  export interface FastifyCookieOptions {
    secret?: string | string[] | Signer;
    parseOptions?: fastifyCookie.CookieSerializeOptions;
  }

  export type Sign = (value: string, secret: string) => string;
  export type Unsign = (input: string, secret: string) => string | false;
  export type SignerFactory = (secret: string) => Signer;

  export const signerFactory: SignerFactory;
  export const sign: Sign;
  export const unsign: Unsign;

  export interface FastifyCookie extends FastifyCookiePlugin {
    signerFactory: SignerFactory;
    sign: Sign;
    unsign: Unsign;
  }

  export const fastifyCookie: FastifyCookie;

  export interface FastifyCookieOptions {
    secret?: string | string[] | Signer;
    parseOptions?: CookieSerializeOptions;
  }

  export { fastifyCookie as default };
}

declare function fastifyCookie(
  ...params: Parameters<FastifyCookiePlugin>
): ReturnType<FastifyCookiePlugin>;

export = fastifyCookie;
