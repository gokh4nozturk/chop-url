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

// Helper to merge metadata
const mergeMetadata = (
  routeMetadata: Partial<RouteDefinition>,
  groupMetadata: Partial<RouteDefinition> = {},
  defaultMetadata: Partial<RouteDefinition> = {}
): RouteDefinition => {
  return {
    ...defaultMetadata,
    ...groupMetadata,
    ...routeMetadata,
    tags: [
      ...(defaultMetadata.tags || []),
      ...(groupMetadata.tags || []),
      ...(routeMetadata.tags || []),
    ],
  } as RouteDefinition;
};

export const createRouteGroup = (
  group: RouteGroup,
  options: RouteRegistrationOptions = {}
): RegisteredRoute[] => {
  const { basePath = '', defaultMetadata = {} } = options;

  return group.routes.map((route) => {
    // Validate route configuration
    validateRouteConfig(route, group.prefix);

    // Build full path
    const fullPath = `${basePath}${group.prefix}${route.path}`;

    // Merge metadata from different levels
    const metadata = mergeMetadata(
      route,
      group.defaultMetadata,
      defaultMetadata
    );

    // Create enriched route
    const enrichedRoute: RegisteredRoute = {
      ...metadata,
      path: fullPath,
      method: route.method,
      handler: route.handler,
      metadata: {
        ...metadata,
        tags: [...(metadata.tags || []), group.tag],
      },
      schema: route.schema,
    };

    // Register OpenAPI schema if present
    if (enrichedRoute.schema) {
      registerSchema(fullPath, enrichedRoute.method, enrichedRoute.schema, {
        description: enrichedRoute.description,
        deprecated: enrichedRoute.metadata.deprecated,
      });
    }

    return enrichedRoute;
  });
};

// Helper to create route groups with common configuration
export const createRouteGroups = (
  groups: RouteGroup[],
  options: RouteRegistrationOptions = {}
): RegisteredRoute[] => {
  return groups.flatMap((group) => createRouteGroup(group, options));
};
