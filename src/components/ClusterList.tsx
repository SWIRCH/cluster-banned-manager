import type { Cluster } from '@/types/cluster'
import type { PingMap } from '@/types/ping'
import { Checkbox } from '@headlessui/react'
import { AnimatePresence, motion, Variants } from 'framer-motion'
import { useTranslation } from 'react-i18next'

const cardVariants: Variants = {
	hidden: {
		opacity: 0,
		y: -12
	},
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: {
			delay: i * 0.22,
			duration: 0.35,
			ease: 'easeOut'
		}
	}),
	exit: {
		opacity: 0,
		y: 10,
		transition: {
			duration: 0.25,
			ease: 'easeIn'
		}
	}
}

export default function ClusterList({
	clusters,
	checkedMap = {},
	onToggle,
	pings = {},
	isMobile
}: {
	clusters: Cluster[]
	checkedMap?: Record<string, boolean>
	onToggle?: (domain: string, checked: boolean) => void
	pings?: PingMap
	isMobile?: boolean
}) {
	const { t } = useTranslation()

	return (
		<div
			className={`ban-clusters-2-container ${isMobile ? 'space-y-2 pb-4' : undefined}`}
		>
			<AnimatePresence mode="popLayout">
				{clusters.map((c, index) => {
					const isChecked = !!checkedMap[c.domain]

					return (
						<motion.div
							key={c.domain}
							custom={index}
							variants={cardVariants}
							initial="hidden"
							animate="visible"
							exit="exit"
							className="w-full mt-2"
						>
							<div
								onClick={() => onToggle && onToggle(c.domain, !isChecked)}
								className="block rounded-xl p-6 sm:p-4 relative w-full cursor-pointer select-none transition-colors hover:bg-white/5"
								style={
									pings &&
									pings[c.domain] &&
									(pings[c.domain].status !== 'ok' ||
										pings[c.domain].lossPercent === 100)
										? { background: 'rgba(255, 0, 0, 0.11)' }
										: { background: 'rgba(255, 255, 255, 0.03)' }
								}
							>
								<div className="flex items-center">
									<span className="font-semibold text-3xl text-white">
										{c.id}
									</span>
									<hr className="vertical" />
									<div className="text-sm text-white/50 m-0">
										{t((c.location_key as any) ?? 'locations.unknown')}
										<br />
										{(() => {
											const p = pings[c.domain]
											if (!p) return '—'
											const avg = p.avg
											const display =
												avg !== null && avg !== undefined ? `${avg} ms` : '—'
											const cls =
												avg === null || avg === undefined
													? 'text-white/50'
													: avg <= 50
														? 'text-green-400'
														: avg >= 105
															? 'text-red-400'
															: 'text-yellow-400'
											return (
												<span>
													<span className={cls}>{display}</span>{' '}
													<span className="text-white/50">
														({p.lossPercent}% loss)
													</span>
												</span>
											)
										})()}
									</div>
									<div className="absolute right-4">
										<Checkbox
											checked={isChecked}
											onChange={() => {
												/* Клик перехватывается родителем */
											}}
											className="flex size-6 group rounded-md bg-white/10 p-1 ring-white/15 focus:not-data-focus:outline-none data-checked:bg-white data-focus:outline data-focus:outline-offset-2 data-focus:outline-white"
										>
											<svg
												className="stroke-white opacity-0 group-data-checked:opacity-100"
												viewBox="0 0 14 14"
												fill="none"
											>
												<path
													d="M3 8L6 11L11 3.5"
													strokeWidth={2}
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</svg>
										</Checkbox>
									</div>
								</div>
							</div>
						</motion.div>
					)
				})}
			</AnimatePresence>
		</div>
	)
}
