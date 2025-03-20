import type {
  RegisteredRoute,
  RouteDefinition,
  RouteGroup,
  RouteRegistrationOptions,
} from '../types/route.types';
import { registerSchema } from './openapi';

// Helper to validate route configuration
const validateRouteConfig = (route: RouteDefinition, groupPrefix: string) => {
  if (!route.path.startsWith('/')) {
    throw new Error(`Route path must start with /: ${route.path}`);
  }

  if (route.path.startsWith(groupPrefix)) {
    throw new Error(
      `Route path should not include group prefix. Found: ${route.path}, Group prefix: ${groupPrefix}`
    );
  }

  if (route.schema?.response === undefined) {
    throw new Error(`Response schema is required for route: ${route.path}`);
  }
};

// Helper to register a route with its schema
const registerRouteSchema = (
  route: RouteDefinition,
  prefix: string,
  basePath = ''
) => {
  const path = `${prefix}${route.path}`;
  const fullPath = `${basePath}${path}`;

  if (route.schema) {
    try {
      const method = route.method.toLowerCase() as never;
      registerSchema(path, method, route.schema, {
        description: route.description,
      });
    } catch (error) {
      console.error(`Error registering schema for ${fullPath}:`, error);
      throw error;
    }
  }

  return fullPath;
};

// Create a route group based on configuration
export const createRouteGroup = (
  group: RouteGroup,
  options: RouteRegistrationOptions = {}
): RegisteredRoute[] => {
  // Normalize prefix
  const prefix = group.prefix.endsWith('/')
    ? group.prefix.slice(0, -1)
    : group.prefix;

  // Register routes
  return group.routes.map((route) => {
    // Validate route configuration
    validateRouteConfig(route, prefix);

    // Register route schema if present
    if (route.schema) {
      registerRouteSchema(route, prefix, options.basePath);
    }

    // Merge metadata
    const metadata = {
      ...options.defaultMetadata,
      ...group.defaultMetadata,
      ...route,
      tags: [
        ...(options.defaultMetadata?.tags || []),
        ...(Array.isArray(group.tag) ? group.tag : [group.tag]).filter(Boolean),
        ...(route.tags || []),
      ],
    };

    // Debug the result
    console.log(
      `Route ${route.method.toUpperCase()} ${prefix}${route.path} tags:`,
      metadata.tags
    );

    return {
      path: `${prefix}${route.path}`,
      method: route.method,
      handler: route.handler,
      metadata,
      schema: route.schema,
      description:
        route.description ||
        `${route.method.toUpperCase()} ${prefix}${route.path}`,
    };
  });
};

// Helper to create route groups with common configuration
export const createRouteGroups = (
  groups: RouteGroup[],
  options: RouteRegistrationOptions = {}
): RegisteredRoute[] => {
  return groups.flatMap((group) => createRouteGroup(group, options));
};
