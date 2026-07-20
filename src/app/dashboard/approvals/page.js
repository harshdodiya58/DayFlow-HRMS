'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

export default function ApprovalsPage() {
    const [approvals, setApprovals] = useState([])
    const [loading, setLoading] = useState(true)
    const [actioning, setActioning] = useState(null)
    const [comments, setComments] = useState({})

    useEffect(() => {
        fetchApprovals()
    }, [])

    const fetchApprovals = async () => {
        try {
            const res = await fetch('/api/dashboard/approvals')
            const data = await res.json()
            if (data.success) {
                setApprovals(data.approvals)
            }
        } catch (error) {
            console.error('Failed to fetch approvals', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (stepId, status) => {
        setActioning(stepId)
        try {
            const res = await fetch('/api/dashboard/approvals', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stepId, status, comments: comments[stepId] || '' })
            })
            if (res.ok) {
                setComments(prev => ({ ...prev, [stepId]: '' }))
                fetchApprovals()
            } else {
                const data = await res.json()
                alert(data.error)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setActioning(null)
        }
    }

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
            <div className="flex justify-between items-center bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Action Center</h1>
                    <p className="text-white/60 mt-2">Manage pending approvals routed to you.</p>
                </div>
            </div>

            <div className="space-y-6">
                {loading ? (
                    <div className="text-center text-white/50 py-10">Loading approvals...</div>
                ) : approvals.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 p-10 rounded-3xl text-center">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">You're all caught up!</h3>
                        <p className="text-white/60">No pending approvals in your queue.</p>
                    </div>
                ) : (
                    approvals.map(step => (
                        <div key={step.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl transition">
                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-white/10 pb-4 mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-yellow-500" />
                                        {step.request?.workflow?.type} Request
                                    </h3>
                                    <p className="text-white/60 text-sm mt-1">
                                        Submitted by <span className="text-white font-medium">{step.request?.requester?.firstName} {step.request?.requester?.lastName}</span> via {step.request?.workflow?.name}
                                    </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${step.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' : (step.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}`}>
                                    {step.status}
                                </span>
                            </div>

                            {step.status === 'PENDING' ? (
                                <div className="space-y-4">
                                    <textarea 
                                        placeholder="Add optional comments..."
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500"
                                        rows="2"
                                        value={comments[step.id] || ''}
                                        onChange={(e) => setComments(prev => ({ ...prev, [step.id]: e.target.value }))}
                                    ></textarea>
                                    <div className="flex gap-4 justify-end">
                                        <button 
                                            onClick={() => handleAction(step.id, 'REJECTED')}
                                            disabled={actioning === step.id}
                                            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-6 py-2 rounded-xl font-bold transition disabled:opacity-50"
                                        >
                                            <XCircle className="w-5 h-5" /> Reject
                                        </button>
                                        <button 
                                            onClick={() => handleAction(step.id, 'APPROVED')}
                                            disabled={actioning === step.id}
                                            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl font-bold transition disabled:opacity-50"
                                        >
                                            <CheckCircle className="w-5 h-5" /> Approve
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-white/80 text-sm italic">{step.comments ? `"${step.comments}"` : "No comments provided."}</p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
