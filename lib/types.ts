export type Sector = 'Growth' | 'Digital' | 'Tech-IA' | 'Unknown';
export type Status = 'To Contact' | 'Contacted' | 'Replied' | 'Qualified' | 'Client';

export interface Lead {
  name: string;
  website: string;
  phone: string;
  city: string;
  team_size: number | null;
  sector: Sector;
  ceo_name: string | null;
  email: string;
  has_ia_services: boolean;
  job_postings: boolean;
  score: number;
  score_reason: string;
  status: Status;
  scraped_at: string;
}

export interface Stats {
  totalLeads: number;
  avgScore: number;
  highScoreLeads: number;
  sectorDistribution: Record<Sector, number>;
}
