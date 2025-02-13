import { toast } from 'sonner';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import apiClient from '../api/client';
import { ApiError } from '../api/error';

interface Domain {
  id: number;
  domain: string;
  isVerified: boolean;
  verificationToken: string;
  verificationMethod: 'DNS_TXT' | 'DNS_CNAME' | 'FILE';
  sslStatus: 'PENDING' | 'ACTIVE' | 'FAILED';
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
  fetchDomains: () => Promise<void>;
  fetchDnsRecords: (domainId: number) => Promise<void>;
  addDomain: (domain: Partial<Domain>) => Promise<void>;
  deleteDomain: (domainId: number) => Promise<void>;
  verifyDomain: (domainId: number) => Promise<void>;
  addDnsRecord: (domainId: number, record: Partial<DnsRecord>) => Promise<void>;
  deleteDnsRecord: (domainId: number, recordId: number) => Promise<void>;
}

export const useDomainStore = create<DomainState>()(
  devtools((set, get) => ({
    domains: [],
    dnsRecords: {},
    isLoading: false,
    error: null,

    fetchDomains: async () => {
      try {
        set({ isLoading: true, error: null });
        const response = await apiClient.get('/api/domains');
        set({ domains: response.data });
      } catch (error) {
        const apiError = error as ApiError;
        set({ error: apiError.message || 'Failed to fetch domains' });
        toast.error('Failed to fetch domains', {
          description: apiError.message || 'An unexpected error occurred',
        });
      } finally {
        set({ isLoading: false });
      }
    },

    fetchDnsRecords: async (domainId: number) => {
      try {
        const response = await apiClient.get(`/api/domains/${domainId}/dns`);
        set((state) => ({
          dnsRecords: {
            ...state.dnsRecords,
            [domainId]: response.data,
          },
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
        const response = await apiClient.post('/api/domains', domain);
        set((state) => ({
          domains: [...state.domains, response.data],
        }));
        toast.success('Domain added successfully', {
          description:
            'Your domain has been added and is pending verification.',
        });
      } catch (error) {
        const apiError = error as ApiError;
        toast.error('Failed to add domain', {
          description: apiError.message || 'An unexpected error occurred',
        });
        throw error;
      }
    },

    deleteDomain: async (domainId: number) => {
      try {
        await apiClient.delete(`/api/domains/${domainId}`);
        set((state) => ({
          domains: state.domains.filter((d) => d.id !== domainId),
          dnsRecords: {
            ...state.dnsRecords,
            [domainId]: [],
          },
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
        const response = await apiClient.post(
          `/api/domains/${domainId}/verify`
        );
        if (response.data.verified) {
          set((state) => ({
            domains: state.domains.map((d) =>
              d.id === domainId ? { ...d, isVerified: true } : d
            ),
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
          `/api/domains/${domainId}/dns`,
          record
        );
        set((state) => ({
          dnsRecords: {
            ...state.dnsRecords,
            [domainId]: [...(state.dnsRecords[domainId] || []), response.data],
          },
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
        await apiClient.delete(`/api/domains/${domainId}/dns/${recordId}`);
        set((state) => ({
          dnsRecords: {
            ...state.dnsRecords,
            [domainId]: state.dnsRecords[domainId]?.filter(
              (r) => r.id !== recordId
            ),
          },
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
  }))
);
