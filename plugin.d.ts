/// <reference types="node" />
import * as fastify from 'fastify';
import {IncomingMessage, ServerResponse, Server} from 'http';
import {FastifyRequest, DefaultQuery, Plugin} from 'fastify';

interface FastifyCookieOptions {}

declare module 'fastify' {
  interface FastifyRequest<
    HttpRequest = IncomingMessage,
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
    sameSite?: boolean | 'lax' | 'strict';
    secure?: boolean;
  }

  interface FastifyReply<HttpResponse = ServerResponse> {
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
  }
}

declare const plugin: Plugin<Server, IncomingMessage, ServerResponse, FastifyCookieOptions>;
export = plugin;
