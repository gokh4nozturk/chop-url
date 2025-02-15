import type {
  DeviceInfo,
  Event,
  EventProperties,
  GeoInfo,
} from '@/lib/store/analytics';

// Safe JSON parse utility
export const safeJsonParse = <T>(
  input: string | null | object,
  fallback: T
): T => {
  if (input === null || input === undefined) {
    return fallback;
  }

  if (typeof input === 'object' && !Array.isArray(input)) {
    return input as T;
  }

  if (typeof input !== 'string') {
    return fallback;
  }

  try {
    const trimmed = input.trim();
    let result: unknown;

    try {
      result = JSON.parse(trimmed);
      if (typeof result === 'string') {
        try {
          const secondParse = JSON.parse(result);
          result = secondParse;
        } catch {
          // If second parse fails, keep the first parse result
        }
      }
    } catch (e) {
      return fallback;
    }

    if (result === null || result === undefined) {
      return fallback;
    }

    return result as T;
  } catch (error) {
    return fallback;
  }
};

export const processDeviceStats = (events: Event[]) => {
  const browsers: Record<string, number> = {};
  const operatingSystems: Record<string, number> = {};
  const devices: Record<string, number> = {};

  for (const event of events) {
    if (!event.deviceInfo) continue;

    try {
      const deviceInfo = safeJsonParse<DeviceInfo>(event.deviceInfo, {
        userAgent: '',
        ip: '',
        browser: 'Unknown',
        browserVersion: '',
        os: 'Unknown',
        osVersion: '',
        deviceType: 'unknown',
      });

      const browserKey =
        deviceInfo.browser && deviceInfo.browserVersion
          ? `${deviceInfo.browser} ${deviceInfo.browserVersion}`.trim()
          : deviceInfo.browser || 'Unknown';
      browsers[browserKey] = (browsers[browserKey] || 0) + 1;

      const deviceType = deviceInfo.deviceType || 'unknown';
      devices[deviceType] = (devices[deviceType] || 0) + 1;

      const osKey =
        deviceInfo.os && deviceInfo.osVersion
          ? `${deviceInfo.os} ${deviceInfo.osVersion}`.trim()
          : deviceInfo.os || 'Unknown';
      operatingSystems[osKey] = (operatingSystems[osKey] || 0) + 1;
    } catch (error) {
      console.warn('Error processing device info:', error);
    }
  }

  return { browsers, operatingSystems, devices };
};

export const processEvents = (events: Event[]) => {
  const devices: Record<string, number> = {};
  const browsers: Record<string, number> = {};
  const operatingSystems: Record<string, number> = {};
  const countries: Record<string, number> = {};
  const cities: Record<string, number> = {};
  const regions: Record<string, number> = {};
  const timezones: Record<string, number> = {};
  const sources: Record<string, number> = {};
  const mediums: Record<string, number> = {};
  const campaigns: Record<string, number> = {};

  for (const event of events) {
    if (event.deviceInfo) {
      const deviceInfo = safeJsonParse<DeviceInfo>(event.deviceInfo, {
        userAgent: '',
        ip: '',
        browser: 'Unknown',
        browserVersion: '',
        os: 'Unknown',
        osVersion: '',
        deviceType: 'unknown',
      });

      const deviceType = deviceInfo.deviceType || 'unknown';
      devices[deviceType] = (devices[deviceType] || 0) + 1;

      const browserKey = deviceInfo.browser
        ? `${deviceInfo.browser} ${deviceInfo.browserVersion}`.trim()
        : 'Unknown';
      browsers[browserKey] = (browsers[browserKey] || 0) + 1;

      const osKey = deviceInfo.os
        ? `${deviceInfo.os} ${deviceInfo.osVersion}`.trim()
        : 'Unknown';
      operatingSystems[osKey] = (operatingSystems[osKey] || 0) + 1;
    }

    if (event.geoInfo) {
      const geoInfo = safeJsonParse<GeoInfo>(event.geoInfo, {
        country: 'Unknown',
        city: 'Unknown',
        region: 'Unknown',
        regionCode: '',
        timezone: 'Unknown',
        longitude: '',
        latitude: '',
        postalCode: '',
      });

      countries[geoInfo.country] = (countries[geoInfo.country] || 0) + 1;

      // Combine city and country for better grouping
      const cityKey =
        geoInfo.city && geoInfo.country
          ? `${geoInfo.city}, ${geoInfo.country}`
          : geoInfo.city || 'Unknown';
      cities[cityKey] = (cities[cityKey] || 0) + 1;

      regions[geoInfo.region] = (regions[geoInfo.region] || 0) + 1;
      timezones[geoInfo.timezone] = (timezones[geoInfo.timezone] || 0) + 1;
    }

    if (event.properties) {
      const properties = safeJsonParse<EventProperties>(event.properties, {
        source: null,
        medium: null,
        campaign: null,
        term: null,
        content: null,
        shortId: '',
        originalUrl: '',
      });

      if (properties.source) {
        sources[properties.source] = (sources[properties.source] || 0) + 1;
      }
      if (properties.medium) {
        mediums[properties.medium] = (mediums[properties.medium] || 0) + 1;
      }
      if (properties.campaign) {
        campaigns[properties.campaign] =
          (campaigns[properties.campaign] || 0) + 1;
      }
    }
  }

  return {
    devices,
    browsers,
    operatingSystems,
    countries,
    cities,
    regions,
    timezones,
    sources,
    mediums,
    campaigns,
  };
};

// Transform data for pie charts
export const transformDataForPieChart = (data: Record<string, number> = {}) =>
  Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({
      name: name || 'Direct',
      value,
    }));

// Transform data for city visualization without limiting
export const transformCityData = (data: Record<string, number> = {}) =>
  Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({
      name: name || 'Unknown',
      value,
    }));
