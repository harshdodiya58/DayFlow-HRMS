"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { MapPin, Network, ShieldCheck, Info, Loader2, Save, ArrowLeft, Trash2, Plus } from "lucide-react"
import Link from "next/link"

export default function AttendanceSettings() {
    const [settings, setSettings] = useState({
        attendanceValidation: "NONE",
        allowedIps: [],
        officeLat: "",
        officeLng: "",
        officeRadius: 100,
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [newIp, setNewIp] = useState("")

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings')
            const data = await res.json()
            if (data.settings) {
                setSettings({
                    attendanceValidation: data.settings.attendanceValidation || "NONE",
                    allowedIps: data.settings.allowedIps || [],
                    officeLat: data.settings.officeLat !== null ? String(data.settings.officeLat) : "",
                    officeLng: data.settings.officeLng !== null ? String(data.settings.officeLng) : "",
                    officeRadius: data.settings.officeRadius || 100,
                })
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        setMessage({ type: '', text: '' })
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...settings,
                    officeLat: settings.officeLat ? parseFloat(settings.officeLat) : null,
                    officeLng: settings.officeLng ? parseFloat(settings.officeLng) : null,
                    officeRadius: parseInt(settings.officeRadius) || 100
                })
            })
            
            if (!res.ok) throw new Error('Failed to save')
            setMessage({ type: 'success', text: 'Settings saved successfully' })
            setTimeout(() => setMessage({ type: '', text: '' }), 3000)
        } catch (error) {
            setMessage({ type: 'error', text: error.message })
        } finally {
            setSaving(false)
        }
    }

    const addIp = () => {
        if (!newIp.trim()) return
        // Simple regex for IP/CIDR validation (rudimentary)
        if (!/^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test(newIp.trim())) {
            setMessage({ type: 'error', text: 'Invalid IP format' })
            return
        }
        if (!settings.allowedIps.includes(newIp.trim())) {
            setSettings({ ...settings, allowedIps: [...settings.allowedIps, newIp.trim()] })
        }
        setNewIp("")
        setMessage({ type: '', text: '' })
    }

    const removeIp = (ipToRemove) => {
        setSettings({ ...settings, allowedIps: settings.allowedIps.filter(ip => ip !== ipToRemove) })
    }

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setMessage({ type: 'error', text: 'Geolocation is not supported by your browser' })
            return
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setSettings({
                    ...settings,
                    officeLat: position.coords.latitude.toFixed(6),
                    officeLng: position.coords.longitude.toFixed(6)
                })
                setMessage({ type: 'success', text: 'Location updated from your current position' })
            },
            () => {
                setMessage({ type: 'error', text: 'Unable to retrieve your location' })
            }
        )
    }

    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
    }

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/admin/settings" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Attendance Validation</h1>
                    <p className="text-slate-500 mt-1">Configure geolocation and IP restrictions for check-ins.</p>
                </div>
            </div>

            {message.text && (
                <div className={`p-4 rounded-xl ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Settings */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Validation Mode</h2>
                                <p className="text-sm text-slate-500">How should employee attendance be verified?</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {[
                                { id: "NONE", label: "No Restrictions", desc: "Employees can check in from anywhere." },
                                { id: "IP_ONLY", label: "IP Address Only", desc: "Must be connected to allowed Wi-Fi/Networks." },
                                { id: "LOCATION_ONLY", label: "Geolocation Only", desc: "Must be within the office radius." },
                                { id: "STRICT", label: "Strict (Both)", desc: "Must match BOTH IP Address and Geolocation." }
                            ].map(mode => (
                                <label key={mode.id} className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${settings.attendanceValidation === mode.id ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-blue-200'}`}>
                                    <input 
                                        type="radio" 
                                        name="validationMode"
                                        value={mode.id}
                                        checked={settings.attendanceValidation === mode.id}
                                        onChange={(e) => setSettings({ ...settings, attendanceValidation: e.target.value })}
                                        className="mt-1 w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                    />
                                    <div>
                                        <div className="font-semibold text-slate-900">{mode.label}</div>
                                        <div className="text-sm text-slate-500 mt-0.5">{mode.desc}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* IP Configuration */}
                    {(settings.attendanceValidation === 'IP_ONLY' || settings.attendanceValidation === 'STRICT') && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <Network className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Allowed IP Addresses</h2>
                                    <p className="text-sm text-slate-500">Add the static IP addresses of your office networks.</p>
                                </div>
                            </div>

                            <div className="flex gap-2 mb-6">
                                <input 
                                    type="text" 
                                    placeholder="e.g., 192.168.1.1" 
                                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={newIp}
                                    onChange={(e) => setNewIp(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addIp()}
                                />
                                <button onClick={addIp} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2">
                                    <Plus className="w-4 h-4" /> Add IP
                                </button>
                            </div>

                            <div className="space-y-2">
                                {settings.allowedIps.length === 0 ? (
                                    <p className="text-slate-400 text-sm italic">No IP addresses added yet. Add at least one to enable IP validation.</p>
                                ) : (
                                    settings.allowedIps.map(ip => (
                                        <div key={ip} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="font-mono text-slate-700">{ip}</span>
                                            <button onClick={() => removeIp(ip)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Geolocation Configuration */}
                    {(settings.attendanceValidation === 'LOCATION_ONLY' || settings.attendanceValidation === 'STRICT') && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">Office Location</h2>
                                        <p className="text-sm text-slate-500">Set coordinates and allowed radius.</p>
                                    </div>
                                </div>
                                <button onClick={getCurrentLocation} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors">
                                    Use My Current Location
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g., 28.6139" 
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={settings.officeLat}
                                        onChange={(e) => setSettings({ ...settings, officeLat: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g., 77.2090" 
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={settings.officeLng}
                                        onChange={(e) => setSettings({ ...settings, officeLng: e.target.value })}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Allowed Radius (meters)</label>
                                <div className="flex items-center gap-4">
                                    <input 
                                        type="range" 
                                        min="10" 
                                        max="1000" 
                                        step="10"
                                        className="flex-1 accent-emerald-500"
                                        value={settings.officeRadius}
                                        onChange={(e) => setSettings({ ...settings, officeRadius: e.target.value })}
                                    />
                                    <div className="w-20 text-center font-semibold text-slate-700 bg-slate-100 py-1 px-2 rounded-lg">
                                        {settings.officeRadius} m
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">Employees must be within this distance from the office coordinates to check in.</p>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100">
                        <div className="flex items-center gap-2 text-blue-700 font-bold mb-2">
                            <Info className="w-5 h-5" /> How it works
                        </div>
                        <ul className="text-sm text-blue-800 space-y-3 list-disc pl-4">
                            <li>When restricted by IP, employees can only check in if their device is connected to the specified network (like office Wi-Fi).</li>
                            <li>When restricted by Geolocation, the browser will ask the employee for their GPS location during check-in.</li>
                            <li>If validation fails, the check-in is rejected by the server.</li>
                        </ul>
                    </div>

                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {saving ? 'Saving Settings...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    )
}
