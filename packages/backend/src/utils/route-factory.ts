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

export const createRouteGroup = (
  group: RouteGroup,
  options: RouteRegistrationOptions = {}
): RegisteredRoute[] => {
  const { basePath = '', defaultMetadata = {} } = options;

  // Convert group tag to array if it's a string
  const groupTags = Array.isArray(group.tag) ? group.tag : [group.tag];

  return group.routes.map((route) => {
    // Validate route configuration
    validateRouteConfig(route, group.prefix);

    // Build full path
    const fullPath = `${basePath}${group.prefix}${route.path}`;

    // Extract route metadata
    const { tags: routeTags, ...routeMetadata } = route;

    // Create enriched route with properly merged metadata
    const enrichedRoute: RegisteredRoute = {
      path: fullPath,
      method: route.method,
      handler: route.handler,
      metadata: {
        ...defaultMetadata,
        ...group.defaultMetadata,
        ...routeMetadata,
        // Use group tags as the primary source of tags
        tags: groupTags,
        description:
          route.description || `${route.method.toUpperCase()} ${fullPath}`,
      },
      schema: route.schema,
      description:
        route.description || `${route.method.toUpperCase()} ${fullPath}`,
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
