'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Target, Star, Plus, CheckCircle, Clock, AlertCircle } from 'lucide-react'

export default function AdminPerformancePage() {
    const [goals, setGoals] = useState([])
    const [reviews, setReviews] = useState([])
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('goals')
    
    // Forms
    const [showGoalForm, setShowGoalForm] = useState(false)
    const [goalData, setGoalData] = useState({ title: '', description: '', targetDate: '', employeeId: '' })
    
    const [showReviewForm, setShowReviewForm] = useState(false)
    const [reviewData, setReviewData] = useState({ title: '', employeeId: '', dueDate: '' })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [goalsRes, reviewsRes, empRes] = await Promise.all([
                fetch('/api/admin/performance/goals'),
                fetch('/api/admin/performance/reviews'),
                fetch('/api/admin/employees')
            ])
            const [goalsData, reviewsData, empData] = await Promise.all([
                goalsRes.json(), reviewsRes.json(), empRes.json()
            ])
            
            if (goalsData.success) setGoals(goalsData.goals)
            if (reviewsData.success) setReviews(reviewsData.reviews)
            if (empData.success) setEmployees(empData.employees)
        } catch (error) {
            console.error('Failed to fetch data', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateGoal = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/admin/performance/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(goalData)
            })
            if (res.ok) {
                setShowGoalForm(false)
                setGoalData({ title: '', description: '', targetDate: '', employeeId: '' })
                fetchData()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleCreateReview = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/admin/performance/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reviewData)
            })
            if (res.ok) {
                setShowReviewForm(false)
                setReviewData({ title: '', employeeId: '', dueDate: '' })
                fetchData()
            } else {
                alert((await res.json()).error)
            }
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Performance & OKRs</h1>
                    <p className="text-white/60 mt-2">Manage company goals, OKRs, and appraisal cycles.</p>
                </div>
            </div>

            <div className="flex gap-4 border-b border-white/10 pb-4">
                <button
                    onClick={() => setActiveTab('goals')}
                    className={`px-6 py-3 rounded-xl font-bold transition ${activeTab === 'goals' ? 'bg-white text-black' : 'text-white/60 hover:bg-white/5'}`}
                >
                    Employee Goals (OKRs)
                </button>
                <button
                    onClick={() => setActiveTab('reviews')}
                    className={`px-6 py-3 rounded-xl font-bold transition ${activeTab === 'reviews' ? 'bg-white text-black' : 'text-white/60 hover:bg-white/5'}`}
                >
                    Performance Reviews
                </button>
            </div>

            {/* Goals Tab */}
            {activeTab === 'goals' && (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button onClick={() => setShowGoalForm(!showGoalForm)} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition">
                            <Plus className="w-5 h-5" /> Assign OKR
                        </button>
                    </div>

                    {showGoalForm && (
                        <form onSubmit={handleCreateGoal} className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                            <h3 className="text-xl font-bold text-white mb-4">Assign New Goal</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input required placeholder="Goal Title" className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white" value={goalData.title} onChange={e => setGoalData({...goalData, title: e.target.value})} />
                                <select required className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white" value={goalData.employeeId} onChange={e => setGoalData({...goalData, employeeId: e.target.value})}>
                                    <option value="">Select Employee</option>
                                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.details?.firstName} {emp.details?.lastName}</option>)}
                                </select>
                                <input type="date" required className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white" value={goalData.targetDate} onChange={e => setGoalData({...goalData, targetDate: e.target.value})} />
                            </div>
                            <textarea placeholder="Goal Description" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white" rows="3" value={goalData.description} onChange={e => setGoalData({...goalData, description: e.target.value})}></textarea>
                            <div className="flex justify-end">
                                <button type="submit" className="bg-white text-black px-6 py-2 rounded-xl font-bold hover:bg-gray-200 transition">Save Goal</button>
                            </div>
                        </form>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {goals.map(goal => (
                            <div key={goal.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><Target className="w-5 h-5 text-blue-400" /> {goal.title}</h3>
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white">{goal.status}</span>
                                </div>
                                <p className="text-white/60 text-sm mb-4 line-clamp-2">{goal.description}</p>
                                <div className="mb-4">
                                    <div className="flex justify-between text-xs text-white/60 mb-1">
                                        <span>Progress</span>
                                        <span>{goal.progress}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all" style={{ width: `${goal.progress}%` }}></div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-white/10 text-xs">
                                    <span className="text-white/60">Assigned to: <span className="text-white font-medium">{goal.employee?.firstName} {goal.employee?.lastName}</span></span>
                                    <span className="text-white/40">Due: {new Date(goal.targetDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button onClick={() => setShowReviewForm(!showReviewForm)} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition">
                            <Plus className="w-5 h-5" /> Start Appraisal Cycle
                        </button>
                    </div>

                    {showReviewForm && (
                        <form onSubmit={handleCreateReview} className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                            <h3 className="text-xl font-bold text-white mb-4">Initiate Performance Review</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input required placeholder="e.g. Q1 2026 Appraisal" className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white" value={reviewData.title} onChange={e => setReviewData({...reviewData, title: e.target.value})} />
                                <select required className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white" value={reviewData.employeeId} onChange={e => setReviewData({...reviewData, employeeId: e.target.value})}>
                                    <option value="">Select Employee</option>
                                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.details?.firstName} {emp.details?.lastName}</option>)}
                                </select>
                                <input type="date" required className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white" value={reviewData.dueDate} onChange={e => setReviewData({...reviewData, dueDate: e.target.value})} />
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" className="bg-white text-black px-6 py-2 rounded-xl font-bold hover:bg-gray-200 transition">Initiate</button>
                            </div>
                        </form>
                    )}

                    <div className="overflow-x-auto bg-white/5 border border-white/10 rounded-3xl">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-white/60 text-sm uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 font-medium">Cycle / Title</th>
                                    <th className="p-4 font-medium">Employee</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium">Ratings (Self / Mgr)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {reviews.map(r => (
                                    <tr key={r.id} className="hover:bg-white/5">
                                        <td className="p-4 text-white font-medium">{r.title}</td>
                                        <td className="p-4 text-white/70">{r.employee?.firstName} {r.employee?.lastName}</td>
                                        <td className="p-4">
                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white">{r.status.replace(/_/g, ' ')}</span>
                                        </td>
                                        <td className="p-4 text-white/70">
                                            <div className="flex items-center gap-2">
                                                <Star className="w-4 h-4 text-yellow-500" />
                                                <span>{r.selfRating || '-'} / {r.managerRating || '-'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
