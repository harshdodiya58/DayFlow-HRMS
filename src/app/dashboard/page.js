"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Clock, Calendar, ArrowRight, Sun, Trophy, Timer, AlertCircle, CheckCircle2, Megaphone, ChevronRight, Loader2 } from "lucide-react"
import { useToast } from "@/components/Toast"
import MonthlySummaryCards from "@/components/MonthlySummaryCards"
import AttendanceTrendChart from "@/components/AttendanceTrendChart"
import LeaveDistributionChart from "@/components/LeaveDistributionChart"
import PayrollTrendsChart from "@/components/PayrollTrendsChart"

function formatTime(ms) {
    if (ms < 0) ms = 0
    const seconds = Math.floor((ms / 1000) % 60)
    const minutes = Math.floor((ms / 1000 / 60) % 60)
    const hours = Math.floor((ms / 1000 / 60 / 60))
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export default function EmployeeDashboard() {
    const toast = useToast()
    const [date, setDate] = useState(new Date())
    const [mounted, setMounted] = useState(false)
    const [attendance, setAttendance] = useState({
        checkedIn: false,
        checkedOut: false,
        checkInTime: null,
        checkOutTime: null,
        status: null
    })
    const [stats, setStats] = useState({
        presentDays: 0,
        lateDays: 0,
        totalHours: 0,
        leaveBalance: 0
    })
    const [leaderboard, setLeaderboard] = useState([])
    const [announcements, setAnnouncements] = useState([])
    const [elapsed, setElapsed] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [isCheckingIn, setIsCheckingIn] = useState(false)
    const [isCheckingOut, setIsCheckingOut] = useState(false)
    const [csrfToken, setCsrfToken] = useState(null)

    // Get greeting based on time
    const getGreeting = () => {
        const hour = date.getHours()
        if (hour < 12) return { text: 'Good Morning', icon: Sun }
        if (hour < 17) return { text: 'Good Afternoon', icon: Sun }
        if (hour < 21) return { text: 'Good Evening', icon: Sun }
        return { text: 'Good Night', icon: Sun }
    }

    const greeting = getGreeting()

    // Load CSRF token
    useEffect(() => {
        const token = localStorage.getItem('csrfToken')
        if (token) setCsrfToken(token)
    }, [])

    // Clock & Mount
    useEffect(() => {
        setMounted(true)
        const timer = setInterval(() => setDate(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    // Fetch All Data
    useEffect(() => {
        async function fetchData() {
            try {
                // Attendance Status
                const resAuth = await fetch('/api/attendance')
                if (resAuth.ok) setAttendance(await resAuth.json())

                // Stats
                const resStats = await fetch('/api/dashboard/stats')
                if (resStats.ok) {
                    const data = await resStats.json()
                    setStats(data.stats)
                }

                // Leaderboard
                const resLB = await fetch('/api/leaderboard')
                if (resLB.ok) {
                    const data = await resLB.json()
                    setLeaderboard(data.leaderboard || [])
                }
                
                // Announcements
                const resAnn = await fetch('/api/admin/announcements')
                if (resAnn.ok) {
                    const data = await resAnn.json()
                    setAnnouncements(data.announcements || [])
                }

            } finally {
                setIsLoading(false)
            }
        }
        fetchData()

        // Timer Interval
        const interval = setInterval(() => {
            setAttendance(prev => {
                if (prev.checkedIn && !prev.checkedOut && prev.checkInTime) {
                    const start = new Date(prev.checkInTime).getTime()
                    const now = new Date().getTime()
                    setElapsed(now - start)
                }
                return prev
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    const handleCheckIn = async () => {
        setIsCheckingIn(true)
        try {
            let lat = null
            let lng = null
            
            // Try to get geolocation
            if (navigator.geolocation) {
                try {
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
                    })
                    lat = position.coords.latitude
                    lng = position.coords.longitude
                } catch (err) {
                    console.log('Geolocation error or denied:', err)
                }
            }

            const res = await fetch('/api/attendance', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                },
                body: JSON.stringify({ lat, lng })
            })
            if (res.ok) {
                const data = await res.json()
                setAttendance({
                    checkedIn: true,
                    checkedOut: false,
                    checkInTime: data.attendance.checkIn
                })
                toast.success('Checked in successfully!')
            } else {
                const data = await res.json()
                toast.error(data.error || 'Check in failed')
            }
        } catch (error) {
            toast.error('Check in failed')
        } finally {
            setIsCheckingIn(false)
        }
    }

    const handleCheckOut = async () => {
        setIsCheckingOut(true)
        try {
            const res = await fetch('/api/attendance', { 
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                }
            })
            if (res.ok) {
                const data = await res.json()
                setAttendance(prev => ({
                    ...prev,
                    checkedOut: true,
                    checkOutTime: data.attendance.checkOut
                }))
                toast.success('Checked out successfully!')
            } else {
                const data = await res.json()
                toast.error(data.error || 'Check out failed')
            }
        } catch (error) {
            toast.error('Check out failed')
        } finally {
            setIsCheckingOut(false)
        }
    }

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8 pb-12"
        >
            {/* Welcome Section */}
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-blue-600 mb-2 font-medium">
                        <greeting.icon className="w-5 h-5" />
                        <span>{greeting.text}</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                        Ready to make today count?
                    </h1>
                </div>
                <div className="text-right hidden md:block">
                    <div className="text-3xl font-light text-slate-700 font-mono">
                        {mounted ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </div>
                    <div className="text-slate-400 font-medium">
                        {mounted ? date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }) : 'Loading...'}
                    </div>
                </div>
            </motion.div>

            {/* Main Action Grid */}
            <motion.div variants={item} className={`grid ${announcements.length > 0 ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-6`}>
                {/* Check In/Out Card */}
                <div className={`${announcements.length > 0 ? 'md:col-span-2' : ''} bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-blue-500/20 group`}>
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Clock className="w-32 h-32" />
                    </div>

                    {attendance.status === 'LEAVE' ? (
                        <div className="relative z-10 flex flex-col h-full justify-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-amber-500/20 p-3 rounded-xl">
                                    <AlertCircle className="w-8 h-8 text-amber-200" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold opacity-90">On Leave Today</h2>
                                    <p className="text-blue-100">You have an approved leave for today. Enjoy your day off!</p>
                                </div>
                            </div>
                        </div>
                    ) : !attendance.checkedIn ? (
                        <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                            <div>
                                <h2 className="text-2xl font-bold opacity-90">Start Your Day</h2>
                                <p className="text-blue-100">You haven't checked in yet.</p>
                            </div>
                            <button
                                onClick={handleCheckIn}
                                disabled={isLoading || isCheckingIn}
                                className="w-fit bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-lg active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
                            >
                                {isCheckingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                {isCheckingIn ? 'Checking In...' : 'Check In Now'}
                            </button>
                        </div>
                    ) : !attendance.checkedOut ? (
                        <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold opacity-90">Today's Session</h2>
                                    <p className="text-blue-100">You are currently working.</p>
                                </div>
                                <div className="text-4xl font-mono font-bold bg-white/20 px-4 py-2 rounded-xl backdrop-blur-sm">
                                    {formatTime(elapsed)}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleCheckOut}
                                    disabled={isCheckingOut}
                                    className="bg-red-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg active:scale-95 flex items-center gap-2 border border-red-400 disabled:opacity-70 disabled:pointer-events-none"
                                >
                                    {isCheckingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                    {isCheckingOut ? 'Checking Out...' : 'Check Out'}
                                </button>
                                <span className="text-sm text-blue-200 font-medium">Started at {new Date(attendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="relative z-10 flex flex-col h-full justify-center gap-4">
                            <h2 className="text-3xl font-bold opacity-90">Workday Complete!</h2>
                            <p className="text-blue-100">You checked out at {new Date(attendance.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. See you tomorrow!</p>
                        </div>
                    )}
                </div>

                {/* Announcements Section */}
                {announcements.length > 0 && (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[300px] md:h-auto">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Megaphone className="w-5 h-5 text-blue-500" />
                                Announcements
                            </h3>
                            <a href="/dashboard/announcements" className="text-xs text-blue-600 font-bold hover:underline">View All</a>
                        </div>
                        <div className="divide-y divide-slate-100 overflow-y-auto custom-scrollbar flex-1">
                            {announcements.slice(0, 5).map((announcement) => (
                                <div key={announcement.id} className="p-4 hover:bg-slate-50 transition-colors flex gap-3 items-start group relative">
                                    {announcement.isPinned && (
                                        <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden rounded-tr-3xl">
                                            <div className="absolute top-0 right-0 bg-blue-500 text-white w-12 h-4 transform rotate-45 translate-x-[14px] -translate-y-[4px] text-[8px] font-bold text-center">PIN</div>
                                        </div>
                                    )}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        announcement.priority === 'URGENT' ? 'bg-red-100 text-red-600' :
                                        announcement.priority === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                                        'bg-blue-100 text-blue-600'
                                    }`}>
                                        <Megaphone className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-slate-900 text-sm truncate pr-6">{announcement.title}</h4>
                                        </div>
                                        <p className="text-xs text-slate-600 line-clamp-2">{announcement.content}</p>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            {new Date(announcement.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Leaderboard Section */}
            <motion.div variants={item}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        Leaderboard Top Performers
                    </h3>
                    <a href="/dashboard/leaderboard" className="text-sm text-blue-600 font-bold hover:underline">View Full Leaderboard</a>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {leaderboard.slice(0, 4).map((category) => {
                        const winner = category.rankings[0]
                        return (
                            <div key={category.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`p-2 rounded-lg bg-slate-100`}>
                                        {/* Simple Icon Map */}
                                        {category.icon === 'sun' && <Sun className="w-5 h-5 text-amber-500" />}
                                        {category.icon === 'dumbbell' && <CheckCircle2 className="w-5 h-5 text-red-500" />}
                                        {category.icon === 'clock' && <Timer className="w-5 h-5 text-purple-500" />}
                                        {category.icon === 'plane' && <AlertCircle className="w-5 h-5 text-blue-500" />}
                                    </div>
                                    <h4 className="font-bold text-slate-700 text-sm">{category.title}</h4>
                                </div>

                                {winner ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                                            {winner.avatar ? <img src={winner.avatar} className="w-full h-full object-cover" /> : null}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 truncate">{winner.name}</p>
                                            <p className="text-xs text-slate-500 font-bold bg-slate-50 px-2 py-0.5 rounded-full w-fit mt-1">{winner.score}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-xs text-slate-400 py-2">No data yet</div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </motion.div>

            {/* Analytics Section */}
            <motion.div variants={item} className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">Analytics & Insights</h3>
                    <p className="text-sm text-slate-500">Track your performance over time</p>
                </div>

                {/* Monthly Summary Cards */}
                <MonthlySummaryCards />

                {/* Charts Grid */}
                <div className="grid lg:grid-cols-2 gap-6">
                    <AttendanceTrendChart />
                    <LeaveDistributionChart />
                </div>

                <div className="grid lg:grid-cols-1 gap-6">
                    <PayrollTrendsChart />
                </div>
            </motion.div>
        </motion.div>
    )
}
