import Modal from './Modal'

type InfoModalProps = {
	open: boolean
	onClose: () => void
	title: string
	message: string
	isError?: boolean
}

export default function InfoModal({
	open,
	onClose,
	title,
	message,
	isError = false
}: InfoModalProps) {
	return (
		<Modal
			open={open}
			onClose={onClose}
			title={title}
			description={message}
			classNames={{
				header: {
					title: isError ? 'text-red-400' : 'text-green-400'
				}
			}}
			zIndex="z-60"
		>
			<div className="flex justify-end gap-2">
				<button
					className="steam-btn bg-yellow-400 text-black px-4 py-2 rounded"
					onClick={onClose}
				>
					ОК
				</button>
			</div>
		</Modal>
	)
}
