export type Cluster = {
  id: string;
  domain: string;
  location?: string;
  latency?: string;
};

export type Region = {
  id: string;
  name: string;
  alias_name?: string;
  icon: string;
  flag_icon: string;
  clusters: Cluster[];
};

export type Game = {
  appId: number;
  name: string;
  icon: string;
  posters?: string[];
  clusters: Region[];
};
