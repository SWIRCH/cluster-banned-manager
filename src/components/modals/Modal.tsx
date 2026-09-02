import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import React from 'react'

export type ModalSizeType =
	| 'sm'
	| 'md'
	| 'lg'
	| 'xl'
	| '2xl'
	| '3xl'
	| '4xl'
	| '5xl'
	| '6xl'
	| '7xl'

const sizeClasses: Record<ModalSizeType, string> = {
	sm: 'max-w-sm',
	md: 'max-w-md',
	lg: 'max-w-lg',
	xl: 'max-w-xl',
	'2xl': 'max-w-2xl',
	'3xl': 'max-w-3xl',
	'4xl': 'max-w-4xl',
	'5xl': 'max-w-5xl',
	'6xl': 'max-w-6xl',
	'7xl': 'max-w-7xl'
}

export type ModalProps = {
	open: boolean
	onClose: () => void | Promise<void>
	title?: string
	description?: string | React.ReactNode
	visibleHeader?: boolean
	children: React.ReactNode
	size?: ModalSizeType
	maxWidthClass?: string
	zIndex?: string
	footer?: React.ReactNode
	classNames?: {
		header?: {
			main?: string
			title?: string
			description?: string
		}
		main?: string
		body?: string
		backdrop?: string
	}
}

export default function Modal({
	open,
	onClose,
	children,
	title,
	description,
	visibleHeader = true,
	footer,
	size = '2xl',
	maxWidthClass,
	zIndex = 'z-50',
	classNames
}: ModalProps) {
	const isHeaderHidden = !visibleHeader || (!title && !description)

	return (
		<Dialog
			open={open}
			onOpenChange={nextOpen => {
				if (!nextOpen) {
					onClose()
				}
			}}
		>
			<AnimatePresence>
				<DialogContent
					autoFocus={false}
					className={cn(
						sizeClasses[size],
						maxWidthClass,
						zIndex,
						classNames?.main,
						'max-h-[500px] overflow-hidden'
					)}
				>
					<DialogHeader
						className={cn(
							isHeaderHidden && 'sr-only',
							classNames?.header?.main
						)}
					>
						<DialogTitle className={cn(classNames?.header?.title)}>
							{title ?? 'Modal'}
						</DialogTitle>

						{description && (
							<DialogDescription
								className={cn(
									classNames?.header?.description,
									'text-white/60!'
								)}
							>
								{description}
							</DialogDescription>
						)}
					</DialogHeader>

					<motion.div
						className={cn(
							// 'body-container relative rounded-xl  backdrop-blur-2xl sm:p-4',
							classNames?.body,
							`${footer ? 'max-h-[325px]' : 'flex-1'}`,
							'overflow-y-auto overflow-x-hidden'
						)}
						initial={{ opacity: 0, y: 8, scale: 0.995 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 8, scale: 0.995 }}
						transition={{ duration: 0.18 }}
					>
						{children}
					</motion.div>

					{footer && (
						<DialogFooter className="max-h-[80px]">{footer}</DialogFooter>
					)}
				</DialogContent>
			</AnimatePresence>
		</Dialog>
	)
}
