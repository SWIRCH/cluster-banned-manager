import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useSettings } from '@/hooks/useSettings'
import { getInitialLanguage } from '@/lib/i18n'
import { useAppStore } from '@/store/useAppStore'
import { langFormat } from '@/utils/langForamter'
import { defaultSettings } from '@/utils/settingsStorage'
import confetti from 'canvas-confetti'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function SetupFirstAppSettings() {
	const { t } = useTranslation()
	const { settings, updateSettings, loading } = useSettings()
	const setIsSetupStore = useAppStore(state => state.setIsSetup)
	const [isOpen, setIsOpen] = useState(false)
	const [step, setStep] = useState<1 | 2 | 3>(1)

	const [formData, setFormData] = useState(defaultSettings)

	useEffect(() => {
		if (!loading && !settings.isSetup) {
			setFormData({
				useFirewall: settings.useFirewall ?? true,
				useBackup: settings.useBackup ?? false,
				backupCount: settings.backupCount ?? 5,
				lang: settings.lang ?? getInitialLanguage()
			})
			setIsOpen(true)
		}
	}, [loading, settings])

	useEffect(() => {
		if (isOpen && step === 1) {
			const end = Date.now() + 1.5 * 1000
			const interval: ReturnType<typeof setInterval> = setInterval(() => {
				if (Date.now() > end) {
					return clearInterval(interval)
				}
				confetti({
					startVelocity: 30,
					spread: 360,
					ticks: 60,
					origin: { x: Math.random(), y: Math.random() - 0.2 }
				})
			}, 250)

			return () => clearInterval(interval)
		}
	}, [isOpen, step])

	const handleNext = () => {
		setStep(prev => (prev + 1) as 1 | 2 | 3)
	}

	const handleBack = () => {
		setStep(prev => (prev - 1) as 1 | 2 | 3)
	}

	const handleCompleteSetup = async () => {
		await updateSettings({
			...formData,
			isSetup: true
		})

		setIsSetupStore(true)
		setIsOpen(false)
	}

	if (loading) return null

	return (
		<Dialog
			open={isOpen}
			onOpenChange={nextOpen => {
				if (!nextOpen) return
				setIsOpen(nextOpen)
			}}
		>
			<DialogContent
				showCloseButton={false}
				className="sm:max-w-[425px]"
			>
				{/* ШАГ 1: Приветствие */}
				{step === 1 && (
					<>
						<DialogHeader>
							<DialogTitle className="text-2xl text-center">
								{t('setup.welcome')}
							</DialogTitle>
							<DialogDescription className="text-center pt-2">
								{t('setup.welcome.description')}
							</DialogDescription>
						</DialogHeader>

						<DialogFooter>
							<Button
								className="w-full"
								onClick={handleNext}
							>
								{t('setup.buttons.start_setup')}
							</Button>
						</DialogFooter>
					</>
				)}

				{/* ШАГ 2: Базовые настройки */}
				{step === 2 && (
					<>
						<DialogHeader>
							<DialogTitle>
								{t('setup.step_2_title', { current: 2, total: 3 })}
							</DialogTitle>
							<DialogDescription>
								{t('setup.step_2_description')}
							</DialogDescription>
						</DialogHeader>

						<div className="grid gap-4 py-4">
							<div className="flex items-center justify-between">
								<Label
									htmlFor="firewall"
									className="cursor-pointer"
								>
									{t('settings.use_firewall')}
								</Label>
								<Switch
									id="firewall"
									checked={formData.useFirewall}
									onCheckedChange={checked =>
										setFormData(prev => ({ ...prev, useFirewall: checked }))
									}
								/>
							</div>

							<div className="flex items-center justify-between">
								<Label
									htmlFor="backup"
									className="cursor-pointer"
								>
									{t('settings.use_backups')}
								</Label>
								<Switch
									id="backup"
									checked={formData.useBackup}
									onCheckedChange={checked =>
										setFormData(prev => ({ ...prev, useBackup: checked }))
									}
								/>
							</div>

							{formData.useBackup && (
								<div className="grid gap-2">
									<Label htmlFor="backupCount">
										{t('settings.backups_count')}
									</Label>
									<Select
										value={String(formData.backupCount)}
										onValueChange={val =>
											setFormData(prev => ({
												...prev,
												backupCount: Number(val)
											}))
										}
									>
										<SelectTrigger id="backupCount">
											<SelectValue placeholder="Выберите количество" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="3">
												{t('setup.backup_count', { count: 3 })}
											</SelectItem>
											<SelectItem value="5">
												{t('setup.backup_count', { count: 5 })}
											</SelectItem>
											<SelectItem value="10">
												{t('setup.backup_count', { count: 10 })}
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}
						</div>

						<DialogFooter className="flex justify-between gap-2 sm:justify-between">
							<Button
								variant="outline"
								onClick={handleBack}
							>
								{t('buttons.back')}
							</Button>
							<Button onClick={handleNext}>{t('buttons.continue')}</Button>
						</DialogFooter>
					</>
				)}

				{/* ШАГ 3: Выбор языка */}
				{step === 3 && (
					<>
						<DialogHeader>
							<DialogTitle>
								{t('setup.step_3_title', { current: 3, total: 3 })}
							</DialogTitle>
							<DialogDescription>
								{t('setup.step_3_description')}
							</DialogDescription>
						</DialogHeader>

						<div className="grid gap-4 py-4">
							<div className="grid gap-2">
								<Label htmlFor="language">
									{t('settings.language_interface')}
								</Label>
								<Select
									value={formData.lang}
									onValueChange={val => {
										if (!val) return

										setFormData(prev => ({ ...prev, lang: val }))
									}}
								>
									<SelectTrigger id="language">
										<SelectValue>{langFormat(formData.lang)}</SelectValue>
									</SelectTrigger>
									<SelectContent>
										<SelectItem
											value="ru"
											title="russian"
										>
											Русский (Russian)
										</SelectItem>
										<SelectItem value="en">English (Английский)</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<DialogFooter className="flex justify-between gap-2 sm:justify-between">
							<Button
								variant="outline"
								onClick={handleBack}
							>
								{t('buttons.back')}
							</Button>
							<Button onClick={handleCompleteSetup}>
								{t('buttons.finish_and_save')}
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	)
}
