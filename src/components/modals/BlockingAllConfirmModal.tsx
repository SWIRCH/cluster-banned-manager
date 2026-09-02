import { useAppStore } from '@/store/useAppStore'
import { useState } from 'react'
import Modal from './Modal'
import { Trans, useTranslation } from 'react-i18next'

type BlockingAllConfirmModalProps = {
	onConfirm: () => void
	regionName: string
}

export default function BlockingAllConfirmModal({
	onConfirm,
	regionName
}: BlockingAllConfirmModalProps) {
	const [ack, setAck] = useState(false)

	const isOpen = useAppStore(state => state.blockingAllConfirmOpen)
	const setIsOpen = useAppStore(state => state.setBlockingAllConfirmOpen)
	const onClose = () => setIsOpen(false)

	const { t } = useTranslation()

	return (
		<Modal
			open={isOpen}
			onClose={onClose}
			zIndex="z-[50]"
			title={t('modals.blocking_all_confirm.title')}
			description={
				<Trans
					i18nKey={'modals.blocking_all_confirm.description'}
					values={{ region: regionName }}
				/>
			}
		>
			<label className="flex items-center gap-2 mb-4">
				<input
					type="checkbox"
					checked={ack}
					onChange={e => setAck(e.target.checked)}
				/>
				<span className="text-sm text-white/60">
					Я понимаю, что это отключит доступ к игре в этом регионе
				</span>
			</label>

			<div className="flex justify-end gap-2">
				<button
					className="btn bg-white/10 px-4 py-2 rounded"
					onClick={onClose}
				>
					Отмена
				</button>
				<button
					className="steam-btn bg-red-600 text-white px-4 py-2 rounded"
					disabled={!ack}
					onClick={() => {
						onConfirm()
						setAck(false)
					}}
				>
					Подтвердить блокировку
				</button>
			</div>
		</Modal>
	)
}
