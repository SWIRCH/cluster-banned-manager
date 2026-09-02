import type { Cluster } from '@/types/cluster'
import type { PingMap } from '@/types/ping'
import ClusterList from './ClusterList'
import { useTranslation } from 'react-i18next'
// import type { Selections } from "@/types/selections";

type SelectiveBlockingProps = {
	clusters: Cluster[]
	checkedMap: Record<string, boolean>
	onToggle: (domain: string, checked: boolean) => void
	pings: PingMap
	isMobile: boolean
}

export default function SelectiveBlocking({
	clusters,
	checkedMap,
	onToggle,
	pings,
	isMobile
}: SelectiveBlockingProps) {
	const domainSet = new Set(clusters.map(c => c.domain))
	const regionPings = Object.entries(pings)
		.filter(([k]) => domainSet.has(k))
		.map(([, v]) => v)

	const vals = regionPings.filter(p => p.avg !== null)
	const avg = vals.length
		? Math.round(vals.reduce((s, x) => s + (x.avg || 0), 0) / vals.length)
		: null
	const ok = regionPings.filter(p => p.status === 'ok').length
	const total = clusters.length

	const { t } = useTranslation()

	return (
		<div
			className={`whilecard ${isMobile ? 'mt-0 flex-1 min-h-0 flex flex-col' : 'mt-5'}  `}
		>
			{!isMobile && (
				<div className="whilecard-title flex sticky top-0 justify-between items-center space-y-1 rounded-xl bg-white/5 p-1 sm:p-2">
					<h3>{t('common.selective_blocking')}</h3>

					{clusters.length > 0 && (
						<div className="text-xs text-white/60 avg-ping">
							<span>
								Avg Ping: {avg ? `${avg} ms` : '—'} ({ok}/{total} ok)
							</span>
						</div>
					)}
				</div>
			)}
			<div
				className={`content p-0 relative ${isMobile ? 'flex-1 min-h-0 flex flex-col' : undefined}`}
			>
				<div
					className={`ban-clusters-2 mt-1 scrollbarYAuto ${isMobile ? 'flex-1 min-h-0' : undefined}`}
				>
					<ClusterList
						clusters={clusters}
						checkedMap={checkedMap}
						onToggle={onToggle}
						pings={pings}
						isMobile={isMobile}
					/>
				</div>
			</div>
		</div>
	)
}
