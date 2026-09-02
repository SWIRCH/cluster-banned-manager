import { useAppStore } from '@/store/useAppStore'
import Modal from './Modal'
import { useTranslation } from 'react-i18next'

type ClearConfirmModalProps = {
	onConfirm: () => void
	useFirewall: boolean
	useBackup: boolean
	loading: boolean
}

export default function ClearConfirmModal({
	onConfirm,
	useFirewall,
	useBackup,
	loading
}: ClearConfirmModalProps) {
	const { t } = useTranslation()
	const isOpen = useAppStore(state => state.clearConfirmOpen)
	const setIsOpen = useAppStore(state => state.setClearConfirmOpen)
	const onClose = () => setIsOpen(false)

	return (
		<Modal
			open={isOpen}
			onClose={onClose}
			zIndex="z-[50]"
		>
			<h3 className="text-lg font-semibold mb-2">
				{t('modals.clear.title', {
					firewall: useFirewall ? ' & Firewall' : ''
				})}
			</h3>
			<p className="text-sm text-white/60 mb-4">
				{t('modals.clear.description', {
					backup: useBackup ? t('modals.clear.backup') : ''
				})}
			</p>
			<div className="flex justify-end gap-2">
				<button
					className="btn bg-white/10 px-4 py-2 rounded"
					onClick={onClose}
				>
					{t('buttons.cancel')}
				</button>
				<button
					className="steam-btn bg-red-600 text-white px-4 py-2 rounded flex items-center w-full"
					onClick={onConfirm}
					disabled={loading}
				>
					{loading ? t('modals.clear.loading') : t('buttons.confirm')}
				</button>
			</div>
		</Modal>
	)
}
