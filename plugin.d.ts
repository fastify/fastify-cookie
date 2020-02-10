/// <reference types="node" />
import * as fastify from 'fastify';
import {FastifyRequest, DefaultQuery, Plugin} from 'fastify';
import {IncomingMessage, ServerResponse} from 'http';
import {Http2ServerRequest, Http2ServerResponse} from 'http2';

type HttpRequest = IncomingMessage | Http2ServerRequest;
type HttpResponse = ServerResponse | Http2ServerResponse;

declare module 'fastify' {
  interface FastifyRequest<
    HttpRequest,
    Query = fastify.DefaultQuery,
    Params = fastify.DefaultParams,
    Headers = fastify.DefaultHeaders,
    Body = any
  > {
    /**
     * Request cookies
     */
    cookies: {[cookieName: string]: string};
  }

  interface CookieSerializeOptions {
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

  interface FastifyReply<HttpResponse> {
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
    ): fastify.FastifyReply<HttpResponse>;

    /**
     * clear response cookie
     * @param name Cookie name
     * @param options Serialize options
     */
    clearCookie(
      name: string,
      options?: CookieSerializeOptions
    ): fastify.FastifyReply<HttpResponse>;

    /**
     * Unsigns the specified cookie using the secret provided.
     * @param value Cookie value
     */
    unsignCookie(
      value: string,
    ): string | false;
  }
}

declare function fastifyCookie(): void;

declare namespace fastifyCookie {
  interface FastifyCookieOptions {}
}

export = fastifyCookie;
