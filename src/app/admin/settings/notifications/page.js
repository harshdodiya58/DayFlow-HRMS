"use client"

import { useState } from "react"
import { Bell, Mail, Smartphone, Save, ArrowLeft, Calendar, FileText, Banknote, Coffee, Loader2 } from "lucide-react"
import { useToast } from "@/components/Toast"
import Link from "next/link"

export default function NotificationsSettings() {
    const toast = useToast()
    const [saving, setSaving] = useState(false)
    
    // Mock state for notifications (to be connected to API later)
    const [settings, setSettings] = useState({
        email_payroll: true,
        push_payroll: false,
        email_leave: true,
        push_leave: true,
        email_attendance: false,
        push_attendance: false,
        email_announcement: true,
        push_announcement: true,
        daily_digest: true
    })

    const handleToggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const handleSave = async () => {
        setSaving(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800))
        toast.success("Notification preferences saved successfully")
        setSaving(false)
    }

    const NotificationItem = ({ title, desc, icon: Icon, emailKey, pushKey }) => (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-slate-100 last:border-0 gap-4">
            <div className="flex items-start gap-4 flex-1">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{desc}</p>
                </div>
            </div>
            <div className="flex items-center gap-6 pl-12 sm:pl-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-600 flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email</span>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input type="checkbox" checked={settings[emailKey]} onChange={() => handleToggle(emailKey)} className="sr-only peer" />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-600 flex items-center gap-1"><Smartphone className="w-3.5 h-3.5" /> Push</span>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input type="checkbox" checked={settings[pushKey]} onChange={() => handleToggle(pushKey)} className="sr-only peer" />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            </div>
        </div>
    )

    return (
        <div className="space-y-6 max-w-4xl pb-20">
            <div className="flex items-center gap-4">
                <Link href="/admin/settings" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Notification Settings</h1>
                    <p className="text-slate-500 mt-1">Configure company-wide alert preferences</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 sm:p-8">
                    <div className="mb-6 flex items-center gap-3 pb-6 border-b border-slate-100">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                            <Bell className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">System Notifications</h2>
                            <p className="text-sm text-slate-500">Determine how the system communicates with employees globally.</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <NotificationItem 
                            title="Payroll & Payslips" 
                            desc="Notify employees when a new payslip is generated and ready to download."
                            icon={Banknote}
                            emailKey="email_payroll"
                            pushKey="push_payroll"
                        />
                        <NotificationItem 
                            title="Leave Requests" 
                            desc="Alert managers of new requests, and notify employees of approvals/rejections."
                            icon={Coffee}
                            emailKey="email_leave"
                            pushKey="push_leave"
                        />
                        <NotificationItem 
                            title="Attendance Alerts" 
                            desc="Send reminders to employees who forget to check in or out."
                            icon={Calendar}
                            emailKey="email_attendance"
                            pushKey="push_attendance"
                        />
                        <NotificationItem 
                            title="Announcements" 
                            desc="Broadcast new company announcements instantly."
                            icon={FileText}
                            emailKey="email_announcement"
                            pushKey="push_announcement"
                        />
                    </div>

                    <div className="mt-8 p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Admin Daily Digest</h3>
                            <p className="text-xs text-slate-500 mt-1">Receive a daily email summary of attendance and pending leaves.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                            <input type="checkbox" checked={settings.daily_digest} onChange={() => handleToggle('daily_digest')} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="pt-8 mt-8 border-t border-slate-100 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-70"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Preferences
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
