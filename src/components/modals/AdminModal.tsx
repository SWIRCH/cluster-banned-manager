import { useAppStore } from '@/store/useAppStore'
import Modal from './Modal'
import { useTranslation } from 'react-i18next'

type AdminModalProps = {
	onShowInstructions: () => void
}

export default function AdminModal({ onShowInstructions }: AdminModalProps) {
	const isOpen = useAppStore(state => state.adminModalOpen)
	const { t } = useTranslation()

	return (
		<Modal
			open={isOpen}
			onClose={onShowInstructions}
			title={t('modals.admin_privileges.title')}
			description={t('modals.admin_privileges.description')}
			zIndex="z-[1000]"
		>
			<div className="flex justify-end gap-2">
				<button
					className="steam-btn bg-yellow-400 text-black px-4 py-2 rounded"
					onClick={onShowInstructions}
				>
					{t('modals.admin_privileges.on_close')}
				</button>
			</div>
		</Modal>
	)
}
