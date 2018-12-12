/// <reference types="node" />
import * as fastify from 'fastify';
import {IncomingMessage, ServerResponse, Server} from 'http';
import {Http2ServerRequest, Http2ServerResponse, Http2Server} from 'http2';
import {FastifyRequest, DefaultQuery, Plugin} from 'fastify';

interface FastifyCookieOptions {}

type HttpServer  = Server | Http2Server;
type HttpRequest = IncomingMessage | Http2ServerRequest;
type HttpResponse = ServerResponse | Http2ServerResponse;

declare module 'fastify' {
  interface FastifyRequest<
    HttpRequest = HttpRequest,
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

  interface FastifyReply<HttpResponse = HttpResponse> {
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

declare const plugin: Plugin<HttpServer, HttpRequest, HttpResponse, FastifyCookieOptions>;
export = plugin;
