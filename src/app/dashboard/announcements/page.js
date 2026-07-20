"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Megaphone, Search, Calendar, ChevronRight } from "lucide-react"

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        async function fetchAnnouncements() {
            try {
                const res = await fetch('/api/admin/announcements')
                if (res.ok) {
                    const data = await res.json()
                    setAnnouncements(data.announcements || [])
                }
            } catch (e) {
                console.error("Failed to load announcements")
            } finally {
                setLoading(false)
            }
        }
        fetchAnnouncements()
    }, [])

    const filteredAnnouncements = announcements.filter(a => 
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.content.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    }

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                    Company Announcements
                </h1>
                <p className="text-slate-500 mt-2">Stay updated with the latest news and updates</p>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search announcements..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-700 shadow-sm"
                />
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-slate-100 rounded-3xl animate-pulse" />
                    ))}
                </div>
            ) : filteredAnnouncements.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Megaphone className="w-10 h-10 text-blue-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">No Announcements Found</h3>
                    <p className="text-slate-500 mt-2">There are no announcements matching your search.</p>
                </div>
            ) : (
                <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
                    {filteredAnnouncements.map((announcement) => (
                        <motion.div variants={item} key={announcement.id} className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                            {announcement.isPinned && (
                                <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden rounded-tr-3xl">
                                    <div className="absolute top-0 right-0 bg-blue-500 text-white w-24 h-6 transform rotate-45 translate-x-[28px] -translate-y-[8px] text-[10px] font-bold text-center flex items-center justify-center">
                                        PINNED
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                                    announcement.priority === 'URGENT' ? 'bg-red-50 text-red-600 border border-red-100' :
                                    announcement.priority === 'HIGH' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                    'bg-blue-50 text-blue-600 border border-blue-100'
                                }`}>
                                    <Megaphone className="w-7 h-7" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <h2 className="text-xl font-bold text-slate-900 pr-10">{announcement.title}</h2>
                                        {announcement.priority !== 'NORMAL' && announcement.priority !== 'LOW' && (
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                announcement.priority === 'URGENT' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                                {announcement.priority} PRIORITY
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{announcement.content}</p>
                                    
                                    <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-slate-50">
                                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-lg">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(announcement.createdAt).toLocaleDateString(undefined, { 
                                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                                            })}
                                        </div>
                                        {announcement.createdBy?.details && (
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
                                                    {announcement.createdBy.details.profilePic ? (
                                                        <img src={announcement.createdBy.details.profilePic} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                            {announcement.createdBy.details.firstName.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-sm font-medium text-slate-700">
                                                    {announcement.createdBy.details.firstName} {announcement.createdBy.details.lastName}
                                                </span>
                                            </div>
                                        )}
                                        {announcement.department && (
                                            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
                                                {announcement.department.name} Team
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    )
}
