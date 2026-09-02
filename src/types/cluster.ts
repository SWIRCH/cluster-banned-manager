export type Cluster = {
	id: string
	domain: string
	location?: string
	location_key?: string
	latency?: string
	ips?: string[]
}

export type Region = {
	id: string
	name: string
	name_key?: string
	alias_name?: string
	icon: string
	flag_icon: string
	clusters: Cluster[]
}

export type Game = {
	appId: number
	name: string
	name_key?: string
	icon: string
	posters?: string[]
	regions: Region[]
}
