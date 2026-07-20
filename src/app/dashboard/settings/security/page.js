"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Shield, Smartphone, Monitor, Tablet, Globe, Trash2,
    Loader2, Key, QrCode, Copy, Check, AlertTriangle,
    Lock, Unlock, Eye, EyeOff, LogOut, RefreshCw
} from "lucide-react"
import { useToast } from "@/components/Toast"

export default function SecuritySettingsPage() {
    const toast = useToast()
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [revoking, setRevoking] = useState(null)
    const [revokingAll, setRevokingAll] = useState(false)

    // 2FA State
    const [twoFAEnabled, setTwoFAEnabled] = useState(false)
    const [showSetup, setShowSetup] = useState(false)
    const [setupData, setSetupData] = useState(null)
    const [verifyCode, setVerifyCode] = useState('')
    const [activating, setActivating] = useState(false)
    const [disableCode, setDisableCode] = useState('')
    const [showDisable, setShowDisable] = useState(false)
    const [disabling, setDisabling] = useState(false)
    const [copiedSecret, setCopiedSecret] = useState(false)
    // Password State
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [changingPassword, setChangingPassword] = useState(false)
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)

    useEffect(() => {
        fetchSessions()
        fetchProfile()
    }, [])

    async function fetchProfile() {
        try {
            const res = await fetch('/api/profile')
            const data = await res.json()
            if (data.user) {
                setTwoFAEnabled(data.user.twoFactorEnabled || false)
            }
        } catch (e) {
            console.error('Failed to fetch profile', e)
        }
    }

    async function fetchSessions() {
        try {
            const res = await fetch('/api/auth/sessions')
            const data = await res.json()
            if (data.sessions) setSessions(data.sessions)
        } catch (e) {
            toast?.error('Failed to load sessions')
        } finally {
            setLoading(false)
        }
    }

    async function revokeSession(sessionId) {
        setRevoking(sessionId)
        try {
            const csrfToken = document.cookie.match(/csrf-token=([^;]+)/)?.[1]
            const res = await fetch(`/api/auth/sessions?sessionId=${sessionId}`, {
                method: 'DELETE',
                headers: { 'x-csrf-token': csrfToken }
            })
            const data = await res.json()
            if (data.success) {
                setSessions(prev => prev.filter(s => s.id !== sessionId))
                toast?.success('Session revoked')
            } else {
                toast?.error(data.error || 'Failed to revoke')
            }
        } catch (e) {
            toast?.error('Something went wrong')
        } finally {
            setRevoking(null)
        }
    }

    async function revokeAllOther() {
        setRevokingAll(true)
        try {
            const csrfToken = document.cookie.match(/csrf-token=([^;]+)/)?.[1]
            const res = await fetch('/api/auth/sessions?all=true', {
                method: 'DELETE',
                headers: { 'x-csrf-token': csrfToken }
            })
            const data = await res.json()
            if (data.success) {
                setSessions(prev => prev.filter(s => s.isCurrent))
                toast?.success('All other sessions revoked')
            }
        } catch (e) {
            toast?.error('Something went wrong')
        } finally {
            setRevokingAll(false)
        }
    }

    // 2FA Functions
    async function startSetup() {
        setShowSetup(true)
        try {
            const csrfToken = document.cookie.match(/csrf-token=([^;]+)/)?.[1]
            const res = await fetch('/api/auth/2fa/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
                body: JSON.stringify({ action: 'generate' })
            })
            const data = await res.json()
            if (data.secret) {
                setSetupData(data)
            } else {
                toast?.error(data.error || 'Failed to generate 2FA secret')
            }
        } catch (e) {
            toast?.error('Something went wrong')
        }
    }

    async function activate2FA() {
        if (verifyCode.length !== 6) return toast?.error('Enter a 6-digit code')
        setActivating(true)
        try {
            const csrfToken = document.cookie.match(/csrf-token=([^;]+)/)?.[1]
            const res = await fetch('/api/auth/2fa/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
                body: JSON.stringify({ action: 'activate', code: verifyCode })
            })
            const data = await res.json()
            if (data.success) {
                setTwoFAEnabled(true)
                setShowSetup(false)
                setShowBackupCodes(true)
                toast?.success('2FA enabled successfully!')
            } else {
                toast?.error(data.error || 'Invalid code')
            }
        } catch (e) {
            toast?.error('Something went wrong')
        } finally {
            setActivating(false)
        }
    }

    async function disable2FA() {
        if (!disableCode) return toast?.error('Enter your current 2FA code')
        setDisabling(true)
        try {
            const csrfToken = document.cookie.match(/csrf-token=([^;]+)/)?.[1]
            const res = await fetch('/api/auth/2fa/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
                body: JSON.stringify({ action: 'disable', code: disableCode })
            })
            const data = await res.json()
            if (data.success) {
                setTwoFAEnabled(false)
                setShowDisable(false)
                setDisableCode('')
                toast?.success('2FA disabled')
            } else {
                toast?.error(data.error || 'Invalid code')
            }
        } catch (e) {
            toast?.error('Something went wrong')
        } finally {
            setDisabling(false)
        }
    }

    async function changePassword(e) {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            return toast?.error('New passwords do not match')
        }
        if (newPassword.length < 8) {
            return toast?.error('Password must be at least 8 characters')
        }
        
        setChangingPassword(true)
        try {
            const csrfToken = document.cookie.match(/csrf-token=([^;]+)/)?.[1]
            const res = await fetch('/api/auth/password/change', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
                body: JSON.stringify({ currentPassword, newPassword })
            })
            const data = await res.json()
            if (data.success) {
                toast?.success(data.message)
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
                // Refresh sessions as others were logged out
                fetchSessions()
            } else {
                toast?.error(data.error || 'Failed to change password')
            }
        } catch (e) {
            toast?.error('Something went wrong')
        } finally {
            setChangingPassword(false)
        }
    }

    function getDeviceIcon(type) {
        switch (type) {
            case 'mobile': return <Smartphone className="w-5 h-5" />
            case 'tablet': return <Tablet className="w-5 h-5" />
            default: return <Monitor className="w-5 h-5" />
        }
    }

    function timeAgo(date) {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000)
        if (seconds < 60) return 'Just now'
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
        return `${Math.floor(seconds / 86400)}d ago`
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 pb-32">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <Shield className="w-7 h-7 text-blue-600" />
                        Security Settings
                    </h1>
                    <p className="text-slate-500 mt-1">Manage your account security, sessions, and two-factor authentication.</p>
                </div>

                {/* Two-Factor Authentication */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${twoFAEnabled ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {twoFAEnabled ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Two-Factor Authentication</h2>
                                    <p className="text-sm text-slate-500">
                                        {twoFAEnabled ? 'Your account is protected with 2FA' : 'Add an extra layer of security'}
                                    </p>
                                </div>
                            </div>
                            <div>
                                {twoFAEnabled ? (
                                    <button
                                        onClick={() => setShowDisable(true)}
                                        className="text-sm font-medium text-red-600 hover:text-red-700 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
                                    >
                                        Disable
                                    </button>
                                ) : (
                                    <button
                                        onClick={startSetup}
                                        className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl transition-colors"
                                    >
                                        Enable 2FA
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 2FA Setup Flow */}
                    <AnimatePresence>
                        {showSetup && !twoFAEnabled && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-slate-100"
                            >
                                <div className="p-6 space-y-5">
                                    {setupData ? (
                                        <>
                                            <div className="bg-blue-50 rounded-xl p-4">
                                                <p className="text-sm text-blue-800 font-medium">
                                                    <strong>Step 1:</strong> Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-center">
                                                <div className="bg-white p-4 rounded-xl border-2 border-dashed border-slate-200">
                                                    <img
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.otpauthUrl)}`}
                                                        alt="2FA QR Code"
                                                        width={200}
                                                        height={200}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-slate-500 mb-1">Or enter this key manually:</label>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 bg-slate-100 px-4 py-2 rounded-lg text-sm font-mono text-slate-800 tracking-wider">
                                                        {setupData.secret}
                                                    </code>
                                                    <button
                                                        onClick={() => { navigator.clipboard.writeText(setupData.secret); setCopiedSecret(true); setTimeout(() => setCopiedSecret(false), 2000) }}
                                                        className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                                                    >
                                                        {copiedSecret ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                                    <strong>Step 2:</strong> Enter the 6-digit code from your app
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="text"
                                                        maxLength={6}
                                                        value={verifyCode}
                                                        onChange={e => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                                                        placeholder="000000"
                                                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900"
                                                    />
                                                    <button
                                                        onClick={activate2FA}
                                                        disabled={verifyCode.length !== 6 || activating}
                                                        className="bg-green-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                                                    >
                                                        {activating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Enable'}
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Disable 2FA Modal */}
                    <AnimatePresence>
                        {showDisable && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-slate-100"
                            >
                                <div className="p-6 bg-red-50/50 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold text-red-800">Disable Two-Factor Authentication?</p>
                                            <p className="text-xs text-red-600 mt-1">This will make your account less secure. Enter your current 2FA code to confirm.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            maxLength={8}
                                            value={disableCode}
                                            onChange={e => setDisableCode(e.target.value)}
                                            placeholder="Enter 2FA or backup code"
                                            className="flex-1 bg-white border border-red-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 text-slate-900"
                                        />
                                        <button
                                            onClick={disable2FA}
                                            disabled={disabling || !disableCode}
                                            className="bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
                                        >
                                            {disabling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Disable'}
                                        </button>
                                        <button
                                            onClick={() => { setShowDisable(false); setDisableCode('') }}
                                            className="text-sm text-slate-600 hover:text-slate-800 px-3 py-2.5"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Backup Codes (shown after 2FA activation) */}
                <AnimatePresence>
                    {showBackupCodes && setupData?.backupCodes && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-amber-50 rounded-2xl border border-amber-200 p-6"
                        >
                            <div className="flex items-start gap-3 mb-4">
                                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                                <div>
                                    <h3 className="font-bold text-amber-900">Save Your Backup Codes</h3>
                                    <p className="text-sm text-amber-700 mt-1">
                                        Store these codes in a safe place. Each code can only be used once if you lose access to your authenticator app.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {setupData.backupCodes.map((code, i) => (
                                    <code key={i} className="bg-white px-3 py-2 rounded-lg text-sm font-mono text-slate-800 text-center border border-amber-100">
                                        {code}
                                    </code>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowBackupCodes(false)}
                                className="mt-4 text-sm font-medium text-amber-800 hover:text-amber-900"
                            >
                                I've saved these codes →
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Change Password */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                    <div className="p-6 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-50 p-2.5 rounded-xl text-purple-600">
                                <Key className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Change Password</h2>
                                <p className="text-sm text-slate-500">Regularly update your password to keep your account secure</p>
                            </div>
                        </div>
                    </div>
                    <form onSubmit={changePassword} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                />
                            </div>
                        </div>
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                                className="bg-purple-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {changingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                                Update Password
                            </button>
                        </div>
                    </form>
                </motion.div>

                {/* Active Sessions */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm"
                >
                    <div className="p-6 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
                                    <Globe className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Active Sessions</h2>
                                    <p className="text-sm text-slate-500">Devices where you're currently logged in</p>
                                </div>
                            </div>
                            {sessions.filter(s => !s.isCurrent).length > 0 && (
                                <button
                                    onClick={revokeAllOther}
                                    disabled={revokingAll}
                                    className="text-sm font-medium text-red-600 hover:text-red-700 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-2"
                                >
                                    {revokingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                                    Log out all other
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="divide-y divide-slate-50">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-12 text-slate-500 text-sm">
                                No active sessions found.
                            </div>
                        ) : (
                            sessions.map(session => (
                                <div key={session.id} className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2.5 rounded-xl ${session.isCurrent ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {getDeviceIcon(session.deviceType)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-slate-900">
                                                    {session.deviceName || 'Unknown Device'}
                                                </span>
                                                {session.isCurrent && (
                                                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                                        This Device
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                                <span>{session.ipAddress || 'Unknown IP'}</span>
                                                <span>•</span>
                                                <span>Active {timeAgo(session.lastActiveAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {!session.isCurrent && (
                                        <button
                                            onClick={() => revokeSession(session.id)}
                                            disabled={revoking === session.id}
                                            className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                            title="Revoke session"
                                        >
                                            {revoking === session.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
