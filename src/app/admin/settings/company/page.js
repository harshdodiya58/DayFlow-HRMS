"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Save, Building2, MapPin, Phone, Mail, Globe, Clock, Loader2, ArrowLeft } from "lucide-react"
import { useToast } from "@/components/Toast"
import Link from "next/link"

export default function CompanyProfileSettings() {
    const toast = useToast()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [csrfToken, setCsrfToken] = useState(null)
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        phone: "",
        email: "",
        website: "",
        timezone: "Asia/Kolkata"
    })

    useEffect(() => {
        const token = localStorage.getItem('csrfToken')
        if (token) setCsrfToken(token)
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings')
            if (res.ok) {
                const data = await res.json()
                if (data.settings) {
                    setFormData({
                        name: data.settings.name || "",
                        address: data.settings.address || "",
                        phone: data.settings.phone || "",
                        email: data.settings.email || "",
                        website: data.settings.website || "",
                        timezone: data.settings.timezone || "Asia/Kolkata"
                    })
                }
            }
        } catch (e) {
            toast.error("Failed to fetch settings")
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                },
                body: JSON.stringify(formData)
            })
            
            if (res.ok) {
                toast.success("Company profile updated successfully")
            } else {
                toast.error("Failed to update company profile")
            }
        } catch (e) {
            toast.error("An error occurred")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
    }

    return (
        <div className="space-y-6 max-w-4xl pb-20">
            <div className="flex items-center gap-4">
                <Link href="/admin/settings" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Company Profile</h1>
                    <p className="text-slate-500 mt-1">Manage your organization's basic details and branding</p>
                </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-slate-400" />
                                    Company Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                                    placeholder="e.g. DayFlow Inc."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    Contact Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                                    placeholder="e.g. hello@dayflow.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-slate-400" />
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                                    placeholder="e.g. +1 (555) 000-0000"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-slate-400" />
                                    Website
                                </label>
                                <input
                                    type="url"
                                    value={formData.website}
                                    onChange={e => setFormData({...formData, website: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                                    placeholder="e.g. https://dayflow.com"
                                />
                            </div>

                            <div className="sm:col-span-2 space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                    Physical Address
                                </label>
                                <textarea
                                    rows={3}
                                    value={formData.address}
                                    onChange={e => setFormData({...formData, address: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                                    placeholder="Enter full company address"
                                />
                            </div>

                            <div className="sm:col-span-2 space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    Timezone
                                </label>
                                <select
                                    value={formData.timezone}
                                    onChange={e => setFormData({...formData, timezone: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                                >
                                    <option value="Asia/Kolkata">India Standard Time (IST)</option>
                                    <option value="America/New_York">Eastern Time (ET)</option>
                                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                    <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                                    <option value="UTC">Coordinated Universal Time (UTC)</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-70"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    )
}
