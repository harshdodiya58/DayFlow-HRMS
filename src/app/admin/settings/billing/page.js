"use client"

import { CreditCard, CheckCircle2, Zap, FileText, ArrowLeft, Download, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

export default function BillingSettings() {
    return (
        <div className="space-y-6 max-w-5xl pb-20">
            <div className="flex items-center gap-4">
                <Link href="/admin/settings" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Billing & Subscription</h1>
                    <p className="text-slate-500 mt-1">Manage your plan, usage, and invoices</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Current Plan Overview */}
                <div className="lg:col-span-2 space-y-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Zap className="w-32 h-32" />
                        </div>
                        <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 text-white rounded-full text-xs font-bold mb-4 backdrop-blur-sm">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Active Subscription
                                </div>
                                <h2 className="text-3xl font-bold opacity-90">Enterprise Pro</h2>
                                <p className="text-slate-400 mt-2">Unlimited access to all premium HRMS features.</p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                                <div>
                                    <p className="text-sm text-slate-400 font-medium mb-1">Current Billing Cycle</p>
                                    <p className="font-bold text-lg">July 1, 2026 - Aug 1, 2026</p>
                                </div>
                                <button className="w-fit bg-white text-slate-900 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-lg active:scale-95">
                                    Change Plan
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Usage Stats */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Usage Breakdown</h3>
                        
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <p className="font-bold text-slate-700 text-sm">Active Employees</p>
                                        <p className="text-xs text-slate-500 mt-1">Employees currently registered and using the platform.</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-slate-900">45</span>
                                        <span className="text-slate-400 text-sm"> / 100 limit</span>
                                    </div>
                                </div>
                                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '45%' }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <p className="font-bold text-slate-700 text-sm">Storage Space</p>
                                        <p className="text-xs text-slate-500 mt-1">Documents, resumes, and assets.</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-slate-900">12 GB</span>
                                        <span className="text-slate-400 text-sm"> / 50 GB limit</span>
                                    </div>
                                </div>
                                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: '24%' }}></div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Right Column: Invoices & Payment */}
                <div className="space-y-6">
                    {/* Payment Method */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-blue-500" />
                            Payment Method
                        </h3>
                        <div className="p-4 border border-slate-100 rounded-2xl flex items-center gap-4 bg-slate-50">
                            <div className="w-12 h-8 bg-white border border-slate-200 rounded flex items-center justify-center font-bold text-blue-800 text-xs italic tracking-tighter shadow-sm">VISA</div>
                            <div className="flex-1">
                                <p className="font-bold text-sm text-slate-700">•••• •••• •••• 4242</p>
                                <p className="text-xs text-slate-500">Expires 12/28</p>
                            </div>
                            <button className="text-sm font-bold text-blue-600 hover:text-blue-700">Edit</button>
                        </div>
                    </motion.div>

                    {/* Invoice History */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-500" />
                            Recent Invoices
                        </h3>
                        
                        <div className="space-y-3">
                            {[
                                { date: 'Jul 1, 2026', amount: '$499.00', status: 'Paid', id: 'INV-2026-07' },
                                { date: 'Jun 1, 2026', amount: '$499.00', status: 'Paid', id: 'INV-2026-06' },
                                { date: 'May 1, 2026', amount: '$499.00', status: 'Paid', id: 'INV-2026-05' }
                            ].map((invoice, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer border border-transparent hover:border-slate-100">
                                    <div>
                                        <p className="font-bold text-sm text-slate-900">{invoice.date}</p>
                                        <p className="text-xs text-slate-500">{invoice.amount} • {invoice.id}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Paid
                                        </span>
                                        <Download className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                            View All Invoices
                        </button>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
