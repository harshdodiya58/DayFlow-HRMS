"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Save, Loader2, UserMinus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/Toast"

export default function InitiateOffboardingPage() {
    const router = useRouter()
    const toast = useToast()
    const [employees, setEmployees] = useState([])
    const [saving, setSaving] = useState(false)
    
    const [formData, setFormData] = useState({
        employeeId: '',
        type: 'RESIGNATION',
        lastWorkingDay: '',
        notes: ''
    })

    useEffect(() => {
        fetchEmployees()
    }, [])

    async function fetchEmployees() {
        try {
            const res = await fetch('/api/admin/employees')
            if (res.ok) {
                const data = await res.json()
                // Filter out employees who are already inactive or already have an offboarding process?
                // For simplicity, we just show active ones
                setEmployees(data.employees?.filter(e => e.status !== 'INACTIVE') || [])
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        
        try {
            const csrfToken = document.cookie.match(/csrf-token=([^;]+)/)?.[1]
            const res = await fetch('/api/admin/offboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
                body: JSON.stringify(formData)
            })
            
            const data = await res.json()
            if (data.success) {
                toast?.success('Offboarding initiated successfully')
                router.push('/admin/offboarding')
            } else {
                toast?.error(data.error || 'Failed to initiate offboarding')
            }
        } catch (error) {
            toast?.error('An unexpected error occurred')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-24">
            <div className="flex items-center gap-4">
                <Link href="/admin/offboarding" className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 text-slate-500">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Initiate Offboarding</h1>
                    <p className="text-slate-500">Start the exit process for an employee</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8 space-y-6">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                            <UserMinus className="w-8 h-8 text-red-500" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Select Employee *</label>
                        <select 
                            required name="employeeId"
                            value={formData.employeeId} onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">Choose an employee...</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.firstName} {emp.lastName} ({emp.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Type of Separation *</label>
                        <select 
                            required name="type"
                            value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="RESIGNATION">Resignation</option>
                            <option value="TERMINATION">Termination</option>
                            <option value="LAYOFF">Layoff</option>
                            <option value="END_OF_CONTRACT">End of Contract</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Last Working Day *</label>
                        <input 
                            type="date" required name="lastWorkingDay"
                            value={formData.lastWorkingDay} onChange={e => setFormData({ ...formData, lastWorkingDay: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Reason (Optional)</label>
                        <textarea 
                            name="notes" rows="4"
                            value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Any additional context..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        ></textarea>
                    </div>
                </div>
                
                <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end gap-3">
                    <Link href="/admin/offboarding" className="px-5 py-2.5 text-slate-600 font-medium hover:text-slate-900 transition-colors">
                        Cancel
                    </Link>
                    <button 
                        type="submit"
                        disabled={saving}
                        className="bg-red-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Initiate
                    </button>
                </div>
            </form>
        </div>
    )
}
