interface CloudflareDnsRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  proxied: boolean;
  ttl: number;
  priority?: number;
}

interface CloudflareApiError {
  errors?: Array<{ message: string }>;
}

interface CloudflareApiResponse<T> {
  result: T;
}

export class CloudflareService {
  private baseUrl = 'https://api.cloudflare.com/client/v4';

  constructor(
    private readonly apiToken: string,
    private readonly accountId: string,
    private readonly zoneId: string
  ) {}

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = (await response.json()) as CloudflareApiError;
      throw new Error(
        `Cloudflare API error: ${error.errors?.[0]?.message || 'Unknown error'}`
      );
    }

    const data = (await response.json()) as CloudflareApiResponse<T>;
    return data.result;
  }

  async getDnsTxtRecords(domain: string): Promise<CloudflareDnsRecord[]> {
    return this.request<CloudflareDnsRecord[]>(
      `/zones/${this.zoneId}/dns_records?type=TXT&name=${domain}`
    );
  }

  async getDnsCnameRecords(domain: string): Promise<CloudflareDnsRecord[]> {
    return this.request<CloudflareDnsRecord[]>(
      `/zones/${this.zoneId}/dns_records?type=CNAME&name=${domain}`
    );
  }

  async createDnsRecord(
    type: string,
    name: string,
    content: string,
    options: {
      ttl?: number;
      priority?: number;
      proxied?: boolean;
    } = {}
  ): Promise<CloudflareDnsRecord> {
    return this.request<CloudflareDnsRecord>(
      `/zones/${this.zoneId}/dns_records`,
      {
        method: 'POST',
        body: JSON.stringify({
          type,
          name,
          content,
          ttl: options.ttl || 1,
          priority: options.priority,
          proxied: options.proxied ?? false,
        }),
      }
    );
  }

  async deleteDnsRecord(recordId: string): Promise<void> {
    await this.request(`/zones/${this.zoneId}/dns_records/${recordId}`, {
      method: 'DELETE',
    });
  }

  async requestSslCertificate(domain: string): Promise<void> {
    await this.request(`/zones/${this.zoneId}/ssl/certificate_packs`, {
      method: 'POST',
      body: JSON.stringify({
        hosts: [domain],
        type: 'advanced',
        validation_method: 'txt',
        validity_days: 365,
      }),
    });
  }

  async getSslStatus(domain: string): Promise<string> {
    const response = await this.request<{ status: string }>(
      `/zones/${this.zoneId}/ssl/certificate_packs?hosts=${domain}`
    );
    return response.status;
  }

  async createZone(domain: string): Promise<{ id: string }> {
    return this.request<{ id: string }>('/zones', {
      method: 'POST',
      body: JSON.stringify({
        name: domain,
        account: { id: this.accountId },
        jump_start: true,
      }),
    });
  }

  async deleteZone(zoneId: string): Promise<void> {
    await this.request(`/zones/${zoneId}`, {
      method: 'DELETE',
    });
  }

  async enableAlwaysUseHttps(domain: string): Promise<void> {
    await this.request(`/zones/${this.zoneId}/settings/always_use_https`, {
      method: 'PATCH',
      body: JSON.stringify({
        value: 'on',
      }),
    });
  }

  async configureSsl(mode: 'flexible' | 'full' | 'strict'): Promise<void> {
    await this.request(`/zones/${this.zoneId}/settings/ssl`, {
      method: 'PATCH',
      body: JSON.stringify({
        value: mode,
      }),
    });
  }
}
