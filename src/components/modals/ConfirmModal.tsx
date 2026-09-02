import { useAppStore } from '@/store/useAppStore'
import type { Cluster } from '@/types/cluster'
import { AnimatePresence, motion } from 'framer-motion'
import Modal from './Modal'
import { Trans, useTranslation } from 'react-i18next'

type ConfirmModalProps = {
	onConfirm: () => void
	domains: string[]
	clusters: Cluster[]
	regionName: string
	onBlockingAllConfirm: () => void
}

export default function ConfirmModal({
	onConfirm,
	domains,
	clusters,
	regionName,
	onBlockingAllConfirm
}: ConfirmModalProps) {
	const isOpen = useAppStore(state => state.confirmOpen)
	const setIsOpen = useAppStore(state => state.setConfirmOpen)
	const onClose = () => setIsOpen(false)

	const isBlockingAll = domains.length === clusters.length

	const { t } = useTranslation()

	return (
		<Modal
			open={isOpen}
			onClose={onClose}
			zIndex="z-[50]"
		>
			<div
				id="confirm-modal"
				style={{ display: 'none' }}
			></div>

			<h3 className="text-lg font-semibold mb-2">
				{t('system.hosts.confirm_update_hosts.title')}
			</h3>
			<p className="text-sm text-white/60 mb-4">
				<Trans
					i18nKey="system.hosts.confirm_update_hosts.add_records_info"
					values={{ region: regionName }}
					components={{
						codeTag: <code />,
						regionTag: <strong />
					}}
				/>
			</p>

			{isBlockingAll && (
				<div className="mb-3 p-3 rounded bg-red-900/20 border border-red-700 text-sm text-red-200">
					{t('common.important')}:{' '}
					<Trans
						i18nKey={'modals.blocking_all_confirm.description'}
						values={{ region: regionName }}
					/>
				</div>
			)}
			<div className="max-h-48 overflow-auto mb-4 bg-white/5 p-3 rounded">
				{domains.length === 0 ? (
					<div className="text-sm">Нет доменов для обновления.</div>
				) : (
					<ul className="text-sm list-disc pl-5">
						<AnimatePresence>
							{domains.map(d => (
								<motion.li
									key={d}
									initial={{ opacity: 0, x: -6 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: -6 }}
									transition={{ duration: 0.12 }}
								>
									{d}
								</motion.li>
							))}
						</AnimatePresence>
					</ul>
				)}
			</div>

			{isBlockingAll && (
				<div className="mb-3 text-sm text-red-200">
					Это действие полностью отключит доступ к серверам выбранного региона —
					будьте осторожны.
				</div>
			)}

			<div className="flex justify-end gap-2">
				<button
					className="btn bg-white/10 px-4 py-2 rounded"
					onClick={onClose}
				>
					Отмена
				</button>
				<button
					className={`steam-btn px-4 py-2 rounded ${
						isBlockingAll ? 'bg-red-600 text-white' : 'bg-yellow-400 text-black'
					}`}
					onClick={() => {
						if (isBlockingAll) {
							onBlockingAllConfirm()
						} else {
							onConfirm()
						}
					}}
				>
					Подтвердить
				</button>
			</div>
		</Modal>
	)
}
