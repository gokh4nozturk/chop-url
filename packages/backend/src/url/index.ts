export interface IUrl {
  id: number;
  short_id: string;
  original_url: string;
  created_at: Date;
  last_accessed_at: Date | null;
  visit_count: number;
}

export interface IVisit {
  id: number;
  url_id: number;
  visited_at: Date;
  ip_address: string;
  user_agent: string;
  referrer: string | null;
}

export interface ICreateUrlResponse {
  shortUrl: string;
  originalUrl: string;
  shortId: string;
}

export interface IUrlStats {
  shortId: string;
  originalUrl: string;
  created: Date;
  lastAccessed: Date | null;
  visitCount: number;
  totalVisits: number;
}
