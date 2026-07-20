"use client"

import { useState, useEffect } from "react"
import { Shield, ShieldAlert, Key, Smartphone, Lock, AlertTriangle, Loader2, ArrowLeft, UserCog } from "lucide-react"
import { useToast } from "@/components/Toast"
import Link from "next/link"

const ROLES = ['EMPLOYEE', 'HR_MANAGER', 'ADMIN']

export default function SecuritySettings() {
    const toast = useToast()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [updatingId, setUpdatingId] = useState(null)
    const [csrfToken, setCsrfToken] = useState(null)

    useEffect(() => {
        const token = localStorage.getItem('csrfToken')
        if (token) setCsrfToken(token)
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/security/roles')
            if (res.ok) {
                const data = await res.json()
                setUsers(data.users || [])
            }
        } catch (e) {
            toast.error("Failed to load user roles")
        } finally {
            setLoading(false)
        }
    }

    const handleRoleChange = async (userId, newRole) => {
        if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return
        
        setUpdatingId(userId)
        try {
            const res = await fetch('/api/admin/security/roles', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                },
                body: JSON.stringify({ userId, role: newRole })
            })
            
            if (res.ok) {
                toast.success("Role updated successfully")
                setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
            } else {
                const data = await res.json()
                toast.error(data.error || "Failed to update role")
            }
        } catch (e) {
            toast.error("An error occurred")
        } finally {
            setUpdatingId(null)
        }
    }

    return (
        <div className="space-y-6 pb-20 max-w-5xl">
            <div className="flex items-center gap-4">
                <Link href="/admin/settings" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Security & Roles</h1>
                    <p className="text-slate-500 mt-1">Manage access control and system-wide security policies</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column: Security Policies */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                            <Shield className="w-5 h-5 text-blue-500" />
                            Security Policies
                        </h2>
                        
                        <div className="space-y-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Smartphone className="w-4 h-4 text-slate-400" /> Force 2FA</h3>
                                    <p className="text-xs text-slate-500 mt-1">Require all users to use Two-Factor Authentication.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                    <input type="checkbox" className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="flex items-start justify-between gap-4 pt-4 border-t border-slate-100">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Lock className="w-4 h-4 text-slate-400" /> Session Timeout</h3>
                                    <p className="text-xs text-slate-500 mt-1">Automatically log out inactive users after 30 minutes.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                            
                            <div className="flex items-start justify-between gap-4 pt-4 border-t border-slate-100">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Key className="w-4 h-4 text-slate-400" /> Strict Passwords</h3>
                                    <p className="text-xs text-slate-500 mt-1">Require symbols, numbers, and uppercase letters.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                        
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-sm text-blue-800">
                            <ShieldAlert className="w-5 h-5 shrink-0 text-blue-600" />
                            <p>Global security policies apply to all employees instantly once saved.</p>
                        </div>
                    </div>
                </div>

                {/* Right Column: User Roles */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden flex flex-col">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                            <UserCog className="w-5 h-5 text-blue-500" />
                            User Roles Management
                        </h2>
                        
                        {loading ? (
                            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-4 py-3 font-medium rounded-tl-xl">Employee</th>
                                            <th className="px-4 py-3 font-medium">Email</th>
                                            <th className="px-4 py-3 font-medium rounded-tr-xl">System Role</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(user => (
                                            <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                            {user.details?.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900">{user.details?.firstName} {user.details?.lastName}</div>
                                                            <div className="text-xs text-slate-500">{user.employeeId}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-slate-600">{user.email}</td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            value={user.role}
                                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                            disabled={updatingId === user.id}
                                                            className={`border rounded-lg text-xs font-bold px-2 py-1 outline-none ${
                                                                user.role === 'ADMIN' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                user.role === 'HR_MANAGER' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                                'bg-slate-50 text-slate-700 border-slate-200'
                                                            }`}
                                                        >
                                                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                                        </select>
                                                        {updatingId === user.id && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
