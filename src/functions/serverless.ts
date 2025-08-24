import { Context, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AppConfig } from '../config/app';
import { authRoutes } from '../routes/auth';
import { noteRoutes } from '../routes/notes';

// Universal serverless handler
export const handler = async (
  event: APIGatewayProxyEvent | any, 
  context: Context | any
): Promise<APIGatewayProxyResult | any> => {
  try {
    // Initialize Fastify app
    const fastifyApp = await AppConfig.createApp();
    
    // Register routes if not already registered
    if (!fastifyApp.hasRoute({
      method: 'GET' as any,
      url: '/auth/register'
    })) {
      await fastifyApp.register(authRoutes, { prefix: '/auth' });
      await fastifyApp.register(noteRoutes, { prefix: '/notes' });
    }

    // Determine the platform and normalize request
    const request = normalizeRequest(event, context);
    
    // Process request through Fastify
    const response = await fastifyApp.inject({
      method: request.method,
      url: request.url,
      headers: request.headers,
      payload: request.body,
      query: request.query
    });

    // Return platform-specific response
    return normalizeResponse(response, event, context);

  } catch (error) {
    console.error('Serverless handler error:', error);
    
    // Universal error response
    const errorResponse = {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'Something went wrong'
      })
    };

    return errorResponse;
  }
};

function normalizeRequest(event: any, context: any) {
  // AWS Lambda API Gateway
  if (event.httpMethod && event.pathParameters) {
    const path = event.pathParameters?.proxy || event.path || '/';
    return {
      method: event.httpMethod.toUpperCase(),
      url: `/${path}${event.queryStringParameters ? `?${new URLSearchParams(event.queryStringParameters).toString()}` : ''}`,
      headers: event.headers || {},
      body: event.body ? (event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body) : undefined,
      query: event.queryStringParameters || {}
    };
  }

  // Azure Functions (HttpRequest)
  if (event.method && event.url) {
    const url = new URL(event.url);
    const path = url.pathname.replace('/api', '') || '/';
    
    return {
      method: event.method.toUpperCase(),
      url: path + url.search,
      headers: Object.fromEntries(event.headers || []),
      body: event.body,
      query: Object.fromEntries(url.searchParams)
    };
  }

  // Vercel (similar to AWS Lambda but with different structure)
  if (event.query && event.body !== undefined) {
    return {
      method: event.method?.toUpperCase() || 'GET',
      url: `${event.path || '/'}${event.query ? `?${new URLSearchParams(event.query).toString()}` : ''}`,
      headers: event.headers || {},
      body: event.body,
      query: event.query || {}
    };
  }

  // Default/fallback
  return {
    method: 'GET',
    url: '/',
    headers: {},
    body: undefined,
    query: {}
  };
}

function normalizeResponse(fastifyResponse: any, event: any, context: any) {
  const responseHeaders: Record<string, string> = {};
  Object.entries(fastifyResponse.headers).forEach(([key, value]) => {
    responseHeaders[key] = Array.isArray(value) ? value.join(', ') : String(value);
  });

  // AWS Lambda response
  if (event.httpMethod && event.pathParameters) {
    return {
      statusCode: fastifyResponse.statusCode,
      headers: responseHeaders,
      body: fastifyResponse.payload,
      isBase64Encoded: false
    };
  }

  // Azure Functions response
  if (event.method && event.url) {
    return {
      status: fastifyResponse.statusCode,
      headers: responseHeaders,
      body: fastifyResponse.payload
    };
  }

  // Vercel response
  return {
    statusCode: fastifyResponse.statusCode,
    headers: responseHeaders,
    body: fastifyResponse.payload
  };
}

// Removed Azure Functions export