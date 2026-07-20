"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, Circle, Clock, FileText, Monitor, BookOpen, UserPlus, HeartHandshake, Loader2 } from "lucide-react"
import { useToast } from "@/components/Toast"

const CATEGORY_ICONS = {
    DOCUMENT: FileText,
    IT_SETUP: Monitor,
    TRAINING: BookOpen,
    POLICY_ACK: CheckCircle2,
    BUDDY: UserPlus,
    WELCOME: HeartHandshake
}

const CATEGORY_COLORS = {
    DOCUMENT: 'bg-blue-50 text-blue-600',
    IT_SETUP: 'bg-purple-50 text-purple-600',
    TRAINING: 'bg-amber-50 text-amber-600',
    POLICY_ACK: 'bg-green-50 text-green-600',
    BUDDY: 'bg-indigo-50 text-indigo-600',
    WELCOME: 'bg-pink-50 text-pink-600'
}

export default function EmployeeOnboardingPage() {
    const toast = useToast()
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(null)

    useEffect(() => {
        fetchTasks()
    }, [])

    async function fetchTasks() {
        try {
            const res = await fetch('/api/onboarding')
            if (res.ok) {
                const data = await res.json()
                setTasks(data.tasks || [])
            }
        } catch (error) {
            console.error("Failed to fetch onboarding tasks:", error)
        } finally {
            setLoading(false)
        }
    }

    const toggleTask = async (progressId, currentStatus, isRequired, assignedRole) => {
        if (assignedRole !== 'EMPLOYEE') {
            return toast?.error('This task will be completed by HR/IT')
        }
        
        const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
        setUpdating(progressId)
        
        // Optimistic UI
        const originalTasks = [...tasks]
        setTasks(ts => ts.map(t => t.id === progressId ? { ...t, status: newStatus } : t))
        
        try {
            const csrfToken = document.cookie.match(/csrf-token=([^;]+)/)?.[1]
            const res = await fetch('/api/onboarding', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
                body: JSON.stringify({ progressId, status: newStatus })
            })
            if (!res.ok) throw new Error('Failed to update')
            if (newStatus === 'COMPLETED') toast?.success('Task completed! 🎉')
        } catch (error) {
            setTasks(originalTasks)
            toast?.error('Failed to update task')
        } finally {
            setUpdating(null)
        }
    }

    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
    }

    if (tasks.length === 0) {
        return (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-sm">
                <HeartHandshake className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to DayFlow!</h2>
                <p className="text-slate-500">You don't have any onboarding tasks assigned right now. You're all set!</p>
            </div>
        )
    }

    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
    const progressPercent = Math.round((completedTasks / tasks.length) * 100)

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-24">
            {/* Header */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Welcome Aboard! 🎉</h1>
                    <p className="text-slate-500 mb-8 max-w-xl">Let's get you set up. Complete these tasks to finish your onboarding process.</p>
                    
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-700">Overall Progress</span>
                        <span className="font-bold text-blue-600">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="bg-blue-600 h-full rounded-full"
                        />
                    </div>
                    <div className="mt-2 text-xs font-medium text-slate-400">
                        {completedTasks} of {tasks.length} tasks completed
                    </div>
                </div>
            </div>

            {/* Task List */}
            <div className="space-y-4">
                {tasks.map((progress, index) => {
                    const task = progress.task
                    const Icon = CATEGORY_ICONS[task.category] || FileText
                    const isCompleted = progress.status === 'COMPLETED'
                    const isEmployeeTask = task.assignedRole === 'EMPLOYEE'
                    
                    return (
                        <motion.div 
                            key={progress.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => toggleTask(progress.id, progress.status, task.isRequired, task.assignedRole)}
                            className={`p-5 rounded-2xl border transition-all ${isEmployeeTask ? 'cursor-pointer' : 'cursor-default'} ${
                                isCompleted 
                                ? 'bg-slate-50 border-slate-200' 
                                : 'bg-white border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md'
                            }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className="mt-1">
                                    {updating === progress.id ? (
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                    ) : isCompleted ? (
                                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                                    ) : (
                                        <Circle className={`w-6 h-6 ${isEmployeeTask ? 'text-slate-300' : 'text-slate-200'}`} />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`font-bold ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                                            {task.title}
                                        </h3>
                                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${CATEGORY_COLORS[task.category] || 'bg-slate-100 text-slate-600'}`}>
                                            {task.category.replace('_', ' ')}
                                        </span>
                                    </div>
                                    {task.description && (
                                        <p className={`text-sm mb-3 ${isCompleted ? 'text-slate-400' : 'text-slate-600'}`}>
                                            {task.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mt-2">
                                        <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                                            <Clock className="w-3.5 h-3.5" />
                                            Due in {task.dueInDays} days
                                        </div>
                                        {!isEmployeeTask && (
                                            <div className="text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                                                Waiting on {task.assignedRole}
                                            </div>
                                        )}
                                        {task.isRequired && <span className="text-red-500">* Required</span>}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
