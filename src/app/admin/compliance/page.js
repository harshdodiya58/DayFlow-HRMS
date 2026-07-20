"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ShieldAlert, Download, Trash2, Search, Loader2, FileJson, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/Toast"

export default function CompliancePage() {
    const toast = useToast()
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    
    // Action states
    const [exportingId, setExportingId] = useState(null)
    const [deletingId, setDeletingId] = useState(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

    useEffect(() => {
        fetchEmployees()
    }, [])

    async function fetchEmployees() {
        try {
            const res = await fetch('/api/admin/employees')
            const data = await res.json()
            if (data.employees) {
                setEmployees(data.employees.filter(e => e.isActive))
            }
        } catch (e) {
            toast?.error('Failed to load employees')
        } finally {
            setLoading(false)
        }
    }

    async function handleExport(employeeId, employeeName) {
        setExportingId(employeeId)
        try {
            const res = await fetch(`/api/admin/compliance/data-export?employeeId=${employeeId}`)
            if (!res.ok) throw new Error('Export failed')
            
            const data = await res.json()
            
            // Create and download JSON file
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `employee_data_export_${employeeId}_${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            
            toast?.success(`Data exported for ${employeeName}`)
        } catch (e) {
            toast?.error('Failed to export data')
        } finally {
            setExportingId(null)
        }
    }

    async function handleAnonymize(employeeId) {
        setDeletingId(employeeId)
        try {
            const csrfToken = document.cookie.match(/csrf-token=([^;]+)/)?.[1]
            const res = await fetch(`/api/admin/compliance/data-deletion?employeeId=${employeeId}`, {
                method: 'DELETE',
                headers: { 'x-csrf-token': csrfToken }
            })
            const data = await res.json()
            
            if (data.success) {
                toast?.success('Employee data anonymized successfully')
                setEmployees(prev => prev.filter(e => e.id !== employeeId))
            } else {
                toast?.error(data.error || 'Failed to anonymize data')
            }
        } catch (e) {
            toast?.error('Something went wrong')
        } finally {
            setDeletingId(null)
            setShowDeleteConfirm(null)
        }
    }

    const filteredEmployees = employees.filter(e => 
        e.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.details?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.details?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <ShieldAlert className="w-8 h-8 text-blue-600" />
                        Data Privacy & Compliance
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Manage GDPR & DPDP Right to Erasure and Data Portability requests.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900">Employee Data Governance</h2>
                    <div className="relative w-64">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search employee..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase font-bold text-slate-500">
                                <th className="p-4">Employee</th>
                                <th className="p-4">ID / Email</th>
                                <th className="p-4">Department</th>
                                <th className="p-4 text-right">Privacy Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-slate-500">
                                        No active employees found.
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-slate-50/50">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900">
                                                {emp.details?.firstName} {emp.details?.lastName}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-slate-600 font-mono text-xs">{emp.employeeId}</div>
                                            <div className="text-slate-500 text-xs mt-0.5">{emp.email}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-medium">
                                                {emp.details?.department?.name || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleExport(emp.id, `${emp.details?.firstName} ${emp.details?.lastName}`)}
                                                    disabled={exportingId === emp.id}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                    title="Export all data (JSON)"
                                                >
                                                    {exportingId === emp.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                                    Export
                                                </button>
                                                
                                                {showDeleteConfirm === emp.id ? (
                                                    <div className="flex items-center gap-2 bg-red-50 px-2 py-1 rounded-lg border border-red-100">
                                                        <span className="text-xs font-bold text-red-700">Sure?</span>
                                                        <button
                                                            onClick={() => handleAnonymize(emp.id)}
                                                            disabled={deletingId === emp.id}
                                                            className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded transition-colors"
                                                        >
                                                            {deletingId === emp.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes, Anonymize'}
                                                        </button>
                                                        <button
                                                            onClick={() => setShowDeleteConfirm(null)}
                                                            className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setShowDeleteConfirm(emp.id)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                        title="Anonymize PII Data"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        Erasure
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3 text-sm text-amber-800">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                    <strong>Data Anonymization Warning:</strong> The Erasure action does not delete the database row (to preserve referential integrity for payroll and audit logs). Instead, it irreversibly scrambles the employee's Personally Identifiable Information (PII) including Name, Email, Address, Bank details, and National IDs, and revokes all active sessions. This action cannot be undone.
                </div>
            </div>
        </div>
    )
}
