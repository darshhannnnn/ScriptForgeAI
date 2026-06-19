import { NextResponse } from 'next/server';

/**
 * Wraps API route handlers to provide consistent database error handling
 */
export function withDBErrorHandler(handler) {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('API Route Error:', error.message);
      
      // Handle MongoDB connection errors
      if (error.isIPWhitelistError) {
        return NextResponse.json(
          {
            error: 'Database Connection Error',
            message: 'Your IP address is not whitelisted in MongoDB Atlas. Please add your current IP to the whitelist.',
            solution: 'Visit https://www.mongodb.com/docs/atlas/security-whitelist/ for instructions',
            type: 'IP_WHITELIST_ERROR'
          },
          { status: 503 }
        );
      }
      
      if (error.isAuthError) {
        return NextResponse.json(
          {
            error: 'Database Authentication Error',
            message: 'Database credentials are invalid. Please check your .env.local file.',
            type: 'AUTH_ERROR'
          },
          { status: 503 }
        );
      }
      
      // Handle other mongoose/mongodb errors
      if (error.name === 'MongoError' || error.name === 'MongooseError') {
        return NextResponse.json(
          {
            error: 'Database Error',
            message: 'Unable to connect to the database. Please try again later.',
            type: 'DATABASE_ERROR'
          },
          { status: 503 }
        );
      }
      
      // Generic error handler
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred. Please try again later.',
          type: 'INTERNAL_ERROR'
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Async wrapper for database operations with better error handling
 */
export async function safeDBOperation(operation, fallback = null) {
  try {
    return await operation();
  } catch (error) {
    console.error('Database operation failed:', error.message);
    
    if (error.isIPWhitelistError || error.isAuthError) {
      // For critical errors, re-throw to be handled by the error handler
      throw error;
    }
    
    // For other errors, return fallback data if provided
    if (fallback !== null) {
      console.log('Returning fallback data due to database error');
      return fallback;
    }
    
    throw error;
  }
}