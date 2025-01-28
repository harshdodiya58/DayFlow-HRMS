"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2, Copy, CheckCheck, Mail, User, KeyRound, ShieldCheck } from "lucide-react"

export default function AddEmployeeModal({ isOpen, onClose, onRefresh }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [credentials, setCredentials] = useState(null) // stores { employeeId, email, password }
    const [csrfToken, setCsrfToken] = useState(null)
    const [copied, setCopied] = useState({})

    useEffect(() => {
        const token = localStorage.getItem('csrfToken')
        if (token) setCsrfToken(token)
    }, [])

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        jobTitle: "",
        department: "",
        joiningDate: new Date().toISOString().split('T')[0],
        phone: "",
        address: ""
    })

    // Reset state when closing/opening
    if (!isOpen && (error || credentials)) {
        setError("")
        setCredentials(null)
        setCopied({})
        setFormData({
            firstName: "",
            lastName: "",
            email: "",
            jobTitle: "",
            department: "",
            joiningDate: new Date().toISOString().split('T')[0],
            phone: "",
            address: ""
        })
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const copyToClipboard = async (text, key) => {
        await navigator.clipboard.writeText(text)
        setCopied(prev => ({ ...prev, [key]: true }))
        setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 2000)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        setCredentials(null)

        try {
            const res = await fetch("/api/admin/employees", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                },
                body: JSON.stringify(formData)
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Failed to create employee")
            }

            setCredentials(data.credentials)
            onRefresh && onRefresh()

        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={credentials ? undefined : onClose}
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden relative z-10"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800">
                                {credentials ? "Employee Created Successfully" : "Add New Employee"}
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            {credentials ? (
                                // ✅ CREDENTIALS CARD
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <ShieldCheck className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-green-800">Account Created!</p>
                                            <p className="text-sm text-green-700">Share these credentials with the employee so they can log in.</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                        <div className="px-4 py-3 bg-slate-100 border-b border-slate-200">
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Login Credentials</p>
                                        </div>
                                        <div className="divide-y divide-slate-100">
                                            {/* Employee ID */}
                                            <div className="flex items-center justify-between px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <User className="w-4 h-4 text-slate-400" />
                                                    <div>
                                                        <p className="text-xs text-slate-500">Employee ID</p>
                                                        <p className="font-mono font-bold text-slate-900 text-lg">{credentials.employeeId}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => copyToClipboard(credentials.employeeId, 'id')}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                                >
                                                    {copied.id ? <CheckCheck className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                    {copied.id ? 'Copied!' : 'Copy'}
                                                </button>
                                            </div>
                                            {/* Email */}
                                            <div className="flex items-center justify-between px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Mail className="w-4 h-4 text-slate-400" />
                                                    <div>
                                                        <p className="text-xs text-slate-500">Email</p>
                                                        <p className="font-medium text-slate-900">{credentials.email}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => copyToClipboard(credentials.email, 'email')}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                                >
                                                    {copied.email ? <CheckCheck className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                    {copied.email ? 'Copied!' : 'Copy'}
                                                </button>
                                            </div>
                                            {/* Password */}
                                            <div className="flex items-center justify-between px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <KeyRound className="w-4 h-4 text-slate-400" />
                                                    <div>
                                                        <p className="text-xs text-slate-500">Temporary Password</p>
                                                        <p className="font-mono font-bold text-blue-700 text-lg tracking-widest">{credentials.password}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => copyToClipboard(credentials.password, 'pass')}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                                >
                                                    {copied.pass ? <CheckCheck className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                    {copied.pass ? 'Copied!' : 'Copy'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                        <p className="text-xs text-amber-700">⚠️ <strong>Save this password now</strong> — it won't be shown again. The employee must verify their email and change the password on first login.</p>
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={() => copyToClipboard(`Employee ID: ${credentials.employeeId}\nEmail: ${credentials.email}\nPassword: ${credentials.password}`, 'all')}
                                            className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium flex items-center gap-2"
                                        >
                                            {copied.all ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                            {copied.all ? 'Copied All!' : 'Copy All'}
                                        </button>
                                        <button
                                            onClick={onClose}
                                            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors text-sm font-medium"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            ) : (

                                <form onSubmit={handleSubmit} className="space-y-6">

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">First Name</label>
                                            <input
                                                name="firstName"
                                                required
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-slate-900"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">Last Name</label>
                                            <input
                                                name="lastName"
                                                required
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-slate-900"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-slate-900"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">Job Title</label>
                                            <input
                                                name="jobTitle"
                                                required
                                                value={formData.jobTitle}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-slate-900"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">Department</label>
                                            <select
                                                name="department"
                                                required
                                                value={formData.department}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none bg-white text-slate-900"
                                            >
                                                <option value="">Select Department</option>
                                                <option value="Engineering">Engineering</option>
                                                <option value="Product">Product</option>
                                                <option value="Design">Design</option>
                                                <option value="HR">HR</option>
                                                <option value="Sales">Sales</option>
                                                <option value="Marketing">Marketing</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">Joining Date</label>
                                            <input
                                                type="date"
                                                name="joiningDate"
                                                required
                                                value={formData.joiningDate}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-slate-900"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">Phone</label>
                                            <input
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-slate-900"
                                            />
                                        </div>
                                    </div>

                                    {error && <p className="text-red-500 text-sm">{error}</p>}

                                    <div className="flex justify-end pt-4">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-6 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors mr-2"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-70"
                                        >
                                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Create Member
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
