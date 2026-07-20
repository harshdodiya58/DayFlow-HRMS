"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { 
    Building2, Users2, Calendar, FileText, Settings, Shield, 
    Bell, CreditCard, ChevronRight, MapPin
} from "lucide-react"

const SETTINGS_CATEGORIES = [
    {
        title: "Organization",
        description: "Company details, departments, and hierarchy",
        items: [
            { name: "Company Profile", desc: "Basic details and branding", icon: Building2, href: "/admin/settings/company" },
            { name: "Departments", desc: "Manage org structure", icon: Users2, href: "/admin/settings/departments" }
        ]
    },
    {
        title: "Time & Leave",
        description: "Holidays, leave policies, and attendance rules",
        items: [
            { name: "Holiday Calendar", desc: "Manage company holidays", icon: Calendar, href: "/admin/holidays" },
            { name: "Leave Policies", desc: "Configure leave types and rules", icon: FileText, href: "/admin/leave-policy" },
            { name: "Attendance Rules", desc: "Configure location and IP restrictions", icon: MapPin, href: "/admin/settings/attendance" }
        ]
    },
    {
        title: "System",
        description: "Security, notifications, and integrations",
        items: [
            { name: "Security & Roles", desc: "Manage access controls", icon: Shield, href: "/admin/settings/security" },
            { name: "Notifications", desc: "Email and push settings", icon: Bell, href: "/admin/settings/notifications" },
            { name: "Billing", desc: "Subscription and invoices", icon: CreditCard, href: "/admin/settings/billing" }
        ]
    }
]

export default function AdminSettings() {
    return (
        <div className="space-y-8 pb-20">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Settings</h1>
                <p className="text-slate-500 mt-1">Configure your HRMS workspace preferences and rules.</p>
            </div>

            <div className="space-y-8">
                {SETTINGS_CATEGORIES.map((category, idx) => (
                    <motion.div 
                        key={category.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm"
                    >
                        <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-900">{category.title}</h2>
                            <p className="text-sm text-slate-500">{category.description}</p>
                        </div>
                        
                        <div className="divide-y divide-slate-100">
                            {category.items.map((item) => (
                                <Link 
                                    key={item.name} 
                                    href={item.href}
                                    className="flex items-center gap-4 p-6 hover:bg-slate-50 transition-colors group"
                                >
                                    <div className="bg-slate-100 text-slate-600 p-3 rounded-xl group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{item.name}</h3>
                                        <p className="text-sm text-slate-500 mt-0.5">{item.desc}</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
