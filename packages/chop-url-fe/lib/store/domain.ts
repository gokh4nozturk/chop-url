import apiClient from '@/lib/api/client';
import { ApiError } from '@/lib/api/error';
import { toast } from 'sonner';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Domain {
  id: number;
  domain: string;
  isVerified: boolean;
  verificationToken: string;
  verificationMethod: 'DNS_TXT' | 'DNS_CNAME' | 'FILE';
  sslStatus:
    | 'PENDING'
    | 'ACTIVE'
    | 'FAILED'
    | 'EXPIRED'
    | 'INITIALIZING'
    | 'INACTIVE';
  isActive: boolean;
  createdAt: string;
  settings: {
    redirectMode: 'PROXY' | 'REDIRECT';
    customNameservers: string | null;
    forceSSL: boolean;
  };
}

interface DnsRecord {
  id: number;
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'NS';
  name: string;
  content: string;
  ttl: number;
  priority?: number;
  proxied: boolean;
  createdAt: string;
}

interface DomainState {
  domains: Domain[];
  dnsRecords: Record<number, DnsRecord[]>;
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
  isFetching: boolean;
  fetchDomains: () => Promise<void>;
  fetchDnsRecords: (domainId: number) => Promise<void>;
  addDomain: (domain: Partial<Domain>) => Promise<void>;
  deleteDomain: (domainId: number) => Promise<void>;
  verifyDomain: (domainId: number) => Promise<void>;
  addDnsRecord: (domainId: number, record: Partial<DnsRecord>) => Promise<void>;
  deleteDnsRecord: (domainId: number, recordId: number) => Promise<void>;
  requestSsl: (domainId: number) => Promise<void>;
  checkSslStatus: (domainId: number) => Promise<void>;
  updateSslSettings: (
    domainId: number,
    settings: { forceSSL: boolean }
  ) => Promise<void>;
}

const CACHE_DURATION = 30 * 1000; // 30 seconds

export const useDomainStore = create<DomainState>()(
  devtools((set, get) => ({
    domains: [],
    dnsRecords: {},
    isLoading: false,
    error: null,
    lastFetch: null,
    isFetching: false,

    fetchDomains: async () => {
      const state = get();
      const now = Date.now();

      // Return cached data if it's fresh enough
      if (
        state.lastFetch &&
        now - state.lastFetch < CACHE_DURATION &&
        state.domains.length > 0
      ) {
        return;
      }

      // Prevent multiple simultaneous fetches
      if (state.isFetching) {
        return;
      }

      try {
        set({ isLoading: true, error: null, isFetching: true });
        const response = await apiClient.get('/domains');
        set({
          domains: response.data,
          lastFetch: now,
        });
      } catch (error) {
        const apiError = error as ApiError;
        set({ error: apiError.message || 'Failed to fetch domains' });
        toast.error('Failed to fetch domains', {
          description: apiError.message || 'An unexpected error occurred',
        });
      } finally {
        set({ isLoading: false, isFetching: false });
      }
    },

    fetchDnsRecords: async (domainId: number) => {
      const state = get();
      const now = Date.now();

      // Return cached data if it's fresh enough
      if (
        state.dnsRecords[domainId] &&
        state.lastFetch &&
        now - state.lastFetch < CACHE_DURATION
      ) {
        return;
      }

      try {
        const response = await apiClient.get(`/domains/${domainId}/dns`);
        set((state) => ({
          dnsRecords: {
            ...state.dnsRecords,
            [domainId]: response.data,
          },
          lastFetch: now,
        }));
      } catch (error) {
        const apiError = error as ApiError;
        toast.error('Failed to fetch DNS records', {
          description: apiError.message || 'An unexpected error occurred',
        });
      }
    },

    addDomain: async (domain: Partial<Domain>) => {
      try {
        console.log('Adding domain:', domain);
        const response = await apiClient.post('/domains', domain);
        console.log('Domain add response:', response.data);
        set((state) => ({
          domains: [...state.domains, response.data],
          lastFetch: Date.now(), // Update cache timestamp
        }));
        toast.success('Domain added successfully', {
          description:
            'Your domain has been added and is pending verification.',
        });
      } catch (error) {
        console.error('Error adding domain:', error);
        const apiError = error as ApiError;
        toast.error('Failed to add domain', {
          description: apiError.message || 'An unexpected error occurred',
        });
        throw error;
      }
    },

    deleteDomain: async (domainId: number) => {
      try {
        await apiClient.delete(`/domains/${domainId}`);
        set((state) => ({
          domains: state.domains.filter((d) => d.id !== domainId),
          dnsRecords: {
            ...state.dnsRecords,
            [domainId]: [],
          },
          lastFetch: Date.now(), // Update cache timestamp
        }));
        toast.success('Domain deleted successfully');
      } catch (error) {
        const apiError = error as ApiError;
        toast.error('Failed to delete domain', {
          description: apiError.message || 'An unexpected error occurred',
        });
        throw error;
      }
    },

    verifyDomain: async (domainId: number) => {
      try {
        const response = await apiClient.post(`/domains/${domainId}/verify`);
        if (response.data.verified) {
          set((state) => ({
            domains: state.domains.map((d) =>
              d.id === domainId ? { ...d, isVerified: true } : d
            ),
            lastFetch: Date.now(), // Update cache timestamp
          }));
          toast.success('Domain verified successfully');
        } else {
          toast.error('Domain verification failed', {
            description: 'Please check your DNS settings and try again.',
          });
        }
      } catch (error) {
        const apiError = error as ApiError;
        toast.error('Failed to verify domain', {
          description: apiError.message || 'An unexpected error occurred',
        });
        throw error;
      }
    },

    addDnsRecord: async (domainId: number, record: Partial<DnsRecord>) => {
      try {
        const response = await apiClient.post(
          `/domains/${domainId}/dns`,
          record
        );
        set((state) => ({
          dnsRecords: {
            ...state.dnsRecords,
            [domainId]: [...(state.dnsRecords[domainId] || []), response.data],
          },
          lastFetch: Date.now(), // Update cache timestamp
        }));
        toast.success('DNS record added successfully');
      } catch (error) {
        const apiError = error as ApiError;
        toast.error('Failed to add DNS record', {
          description: apiError.message || 'An unexpected error occurred',
        });
        throw error;
      }
    },

    deleteDnsRecord: async (domainId: number, recordId: number) => {
      try {
        await apiClient.delete(`/domains/${domainId}/dns/${recordId}`);
        set((state) => ({
          dnsRecords: {
            ...state.dnsRecords,
            [domainId]: state.dnsRecords[domainId]?.filter(
              (r) => r.id !== recordId
            ),
          },
          lastFetch: Date.now(), // Update cache timestamp
        }));
        toast.success('DNS record deleted successfully');
      } catch (error) {
        const apiError = error as ApiError;
        toast.error('Failed to delete DNS record', {
          description: apiError.message || 'An unexpected error occurred',
        });
        throw error;
      }
    },

    requestSsl: async (domainId: number) => {
      try {
        await apiClient.post(`/domains/${domainId}/ssl`);
        set((state) => ({
          domains: state.domains.map((d) =>
            d.id === domainId ? { ...d, sslStatus: 'PENDING' } : d
          ),
          lastFetch: Date.now(),
        }));
        toast.success('SSL certificate requested successfully', {
          description: 'The certificate will be issued shortly.',
        });
      } catch (error) {
        const apiError = error as ApiError;
        toast.error('Failed to request SSL certificate', {
          description: apiError.message || 'An unexpected error occurred',
        });
        throw error;
      }
    },

    checkSslStatus: async (domainId: number) => {
      try {
        const response = await apiClient.get(`/domains/${domainId}/ssl`);
        set((state) => ({
          domains: state.domains.map((d) =>
            d.id === domainId ? { ...d, sslStatus: response.data.status } : d
          ),
          lastFetch: Date.now(),
        }));
      } catch (error) {
        const apiError = error as ApiError;
        toast.error('Failed to check SSL status', {
          description: apiError.message || 'An unexpected error occurred',
        });
        throw error;
      }
    },

    updateSslSettings: async (
      domainId: number,
      settings: { forceSSL: boolean }
    ) => {
      try {
        await apiClient.patch(`/domains/${domainId}/ssl`, settings);
        set((state) => ({
          domains: state.domains.map((d) =>
            d.id === domainId
              ? {
                  ...d,
                  settings: { ...d.settings, forceSSL: settings.forceSSL },
                }
              : d
          ),
          lastFetch: Date.now(),
        }));
        toast.success('SSL settings updated successfully');
      } catch (error) {
        const apiError = error as ApiError;
        toast.error('Failed to update SSL settings', {
          description: apiError.message || 'An unexpected error occurred',
        });
        throw error;
      }
    },
  }))
);
