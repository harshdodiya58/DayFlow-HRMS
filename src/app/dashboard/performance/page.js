'use client'

import { useState, useEffect } from 'react'
import { Target, Star, CheckCircle } from 'lucide-react'

export default function EmployeePerformancePage() {
    const [goals, setGoals] = useState([])
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('goals')

    const [updatingGoal, setUpdatingGoal] = useState(null)
    const [progressValue, setProgressValue] = useState('')

    const [submittingReview, setSubmittingReview] = useState(null)
    const [reviewForm, setReviewForm] = useState({ selfRating: '', selfComments: '' })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [goalsRes, reviewsRes] = await Promise.all([
                fetch('/api/dashboard/performance/goals'),
                fetch('/api/dashboard/performance/reviews')
            ])
            const [goalsData, reviewsData] = await Promise.all([
                goalsRes.json(), reviewsRes.json()
            ])
            
            if (goalsData.success) setGoals(goalsData.goals)
            if (reviewsData.success) setReviews(reviewsData.reviews)
        } catch (error) {
            console.error('Failed to fetch data', error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateGoal = async (goalId) => {
        try {
            const res = await fetch('/api/dashboard/performance/goals', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goalId, progress: progressValue })
            })
            if (res.ok) {
                setUpdatingGoal(null)
                fetchData()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleSubmitReview = async (reviewId) => {
        try {
            const res = await fetch('/api/dashboard/performance/reviews', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewId, ...reviewForm })
            })
            if (res.ok) {
                setSubmittingReview(null)
                setReviewForm({ selfRating: '', selfComments: '' })
                fetchData()
            }
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-center bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">My Performance</h1>
                    <p className="text-white/60 mt-2">Track your goals and complete your self-assessments.</p>
                </div>
            </div>

            <div className="flex gap-4 border-b border-white/10 pb-4">
                <button
                    onClick={() => setActiveTab('goals')}
                    className={`px-6 py-3 rounded-xl font-bold transition ${activeTab === 'goals' ? 'bg-white text-black' : 'text-white/60 hover:bg-white/5'}`}
                >
                    My Goals (OKRs)
                </button>
                <button
                    onClick={() => setActiveTab('reviews')}
                    className={`px-6 py-3 rounded-xl font-bold transition ${activeTab === 'reviews' ? 'bg-white text-black' : 'text-white/60 hover:bg-white/5'}`}
                >
                    My Appraisals
                </button>
            </div>

            {/* Goals Tab */}
            {activeTab === 'goals' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {goals.map(goal => (
                        <div key={goal.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Target className="w-5 h-5 text-blue-400" /> {goal.title}</h3>
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white">{goal.status}</span>
                            </div>
                            <p className="text-white/60 text-sm mb-4 line-clamp-2">{goal.description}</p>
                            
                            {updatingGoal === goal.id ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <input 
                                            type="range" min="0" max="100" 
                                            className="flex-grow accent-blue-500" 
                                            value={progressValue} 
                                            onChange={e => setProgressValue(e.target.value)} 
                                        />
                                        <span className="text-white font-bold w-12">{progressValue}%</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleUpdateGoal(goal.id)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex-grow hover:bg-blue-500 transition">Save</button>
                                        <button onClick={() => setUpdatingGoal(null)} className="bg-white/10 text-white px-4 py-2 rounded-xl text-sm hover:bg-white/20 transition">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex justify-between text-xs text-white/60 mb-1">
                                        <span>Progress</span>
                                        <span>{goal.progress}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-4">
                                        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all" style={{ width: `${goal.progress}%` }}></div>
                                    </div>
                                    <button 
                                        onClick={() => { setUpdatingGoal(goal.id); setProgressValue(goal.progress) }}
                                        className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl text-sm font-medium transition"
                                    >
                                        Update Progress
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    {goals.length === 0 && <div className="text-white/40 col-span-2 text-center py-10">No goals assigned yet.</div>}
                </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
                <div className="space-y-6">
                    {reviews.map(r => (
                        <div key={r.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white">{r.title}</h3>
                                    <p className="text-white/60 text-sm mt-1">Due: {new Date(r.dueDate).toLocaleDateString()}</p>
                                </div>
                                <span className="px-4 py-2 rounded-xl text-sm font-bold bg-white/10 text-white">{r.status.replace(/_/g, ' ')}</span>
                            </div>

                            {r.status === 'SELF_ASSESSMENT_PENDING' ? (
                                <div className="space-y-4">
                                    <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl text-blue-300 text-sm mb-4">
                                        Please complete your self-assessment to proceed to manager review.
                                    </div>
                                    <div>
                                        <label className="block text-white/70 mb-2">Self Rating (1-5)</label>
                                        <div className="flex gap-4">
                                            {[1,2,3,4,5].map(num => (
                                                <button 
                                                    key={num}
                                                    onClick={() => setReviewForm({...reviewForm, selfRating: num})}
                                                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition ${reviewForm.selfRating === num ? 'bg-yellow-500 text-black' : 'bg-black/20 text-white/60 hover:bg-white/10'}`}
                                                >
                                                    {num}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-white/70 mb-2">Comments & Achievements</label>
                                        <textarea 
                                            rows="4"
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white"
                                            placeholder="Highlight your key achievements this cycle..."
                                            value={reviewForm.selfComments}
                                            onChange={e => setReviewForm({...reviewForm, selfComments: e.target.value})}
                                        ></textarea>
                                    </div>
                                    <button 
                                        onClick={() => handleSubmitReview(r.id)}
                                        disabled={!reviewForm.selfRating || !reviewForm.selfComments}
                                        className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition disabled:opacity-50"
                                    >
                                        Submit Assessment
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                                        <h4 className="text-white/60 font-medium mb-4 flex items-center gap-2"><Star className="w-4 h-4" /> Your Self-Assessment</h4>
                                        <div className="text-2xl font-bold text-white mb-2">{r.selfRating}/5</div>
                                        <p className="text-white/80 text-sm whitespace-pre-wrap">{r.selfComments}</p>
                                    </div>
                                    {r.managerRating && (
                                        <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                                            <h4 className="text-white/60 font-medium mb-4 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Manager Assessment</h4>
                                            <div className="text-2xl font-bold text-white mb-2">{r.managerRating}/5</div>
                                            <p className="text-white/80 text-sm whitespace-pre-wrap">{r.managerComments}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    {reviews.length === 0 && <div className="text-white/40 text-center py-10">No appraisals found.</div>}
                </div>
            )}
        </div>
    )
}
