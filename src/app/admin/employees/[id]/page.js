"use client"

import { useState, useEffect, useRef, use } from "react"
import { motion } from "framer-motion"
import { 
    User, Mail, Phone, MapPin, Briefcase, Calendar, 
    FileText, Upload, Download, Trash2, Loader2, CreditCard,
    ShieldCheck, ArrowLeft, Building2, Clock, CheckCircle2
} from "lucide-react"
import { useToast } from "@/components/Toast"
import Link from "next/link"

const DOC_TYPES = [
    { value: 'ID_PROOF', label: 'ID Proof' },
    { value: 'OFFER_LETTER', label: 'Offer Letter' },
    { value: 'TAX_FORM', label: 'Tax Document' },
    { value: 'EDUCATION_CERTIFICATE', label: 'Certification' },
    { value: 'CONTRACT', label: 'Policy Agreement' },
    { value: 'OTHER', label: 'Other Document' }
]

export default function AdminEmployeeDetail({ params }) {
    const resolvedParams = use(params)
    const { id } = resolvedParams
    const toast = useToast()
    
    const [employee, setEmployee] = useState(null)
    const [documents, setDocuments] = useState([])
    const [loading, setLoading] = useState(true)
    const [csrfToken, setCsrfToken] = useState(null)
    const fileInputRef = useRef(null)
    
    // Upload state
    const [uploading, setUploading] = useState(false)
    const [uploadType, setUploadType] = useState('OFFER_LETTER')
    const [uploadTitle, setUploadTitle] = useState('')
    const [selectedFile, setSelectedFile] = useState(null)

    useEffect(() => {
        const token = localStorage.getItem('csrfToken')
        if (token) setCsrfToken(token)
        fetchData()
    }, [id])

    const fetchData = async () => {
        setLoading(true)
        try {
            // First fetch basic employee details. For now, since we don't have a specific /api/admin/employees/[id],
            // we might just fetch from /api/admin/employees and filter, but that's inefficient.
            // Let's assume /api/admin/employees/[id] doesn't exist, we'll create it or just filter from all.
            const resEmp = await fetch('/api/admin/employees')
            if (resEmp.ok) {
                const data = await resEmp.json()
                const emp = (data.employees || []).find(e => e.id.toString() === id)
                if (emp) setEmployee(emp)
                else toast.error("Employee not found")
            }
            
            // Fetch documents for this specific user
            const resDocs = await fetch(`/api/documents?userId=${id}`)
            if (resDocs.ok) {
                const data = await resDocs.json()
                setDocuments(data.documents || [])
            }
        } catch (e) {
            toast.error("Failed to load employee data")
        } finally {
            setLoading(false)
        }
    }

    const handleFileSelect = (e) => {
        const file = e.target.files[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB")
            e.target.value = ''
            return
        }
        setSelectedFile(file)
        if (!uploadTitle) {
            setUploadTitle(file.name.split('.').slice(0, -1).join('.'))
        }
    }

    const handleUpload = async (e) => {
        e.preventDefault()
        if (!selectedFile) {
            toast.error("Please select a file")
            return
        }
        
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', selectedFile)
            formData.append('title', uploadTitle || selectedFile.name)
            formData.append('type', uploadType)
            formData.append('userId', id) // Tell API this is for the employee
            
            const res = await fetch('/api/documents', {
                method: 'POST',
                headers: { ...(csrfToken && { 'x-csrf-token': csrfToken }) },
                body: formData
            })
            
            if (res.ok) {
                toast.success("Document uploaded successfully")
                setSelectedFile(null)
                setUploadTitle('')
                if (fileInputRef.current) fileInputRef.current.value = ''
                fetchData()
            } else {
                const data = await res.json()
                toast.error(data.error || "Failed to upload document")
            }
        } catch (e) {
            toast.error("Upload error")
        } finally {
            setUploading(false)
        }
    }

    const handleDeleteDoc = async (docId) => {
        if (!confirm("Are you sure you want to delete this document?")) return
        
        try {
            const res = await fetch(`/api/documents?id=${docId}`, {
                method: 'DELETE',
                headers: { ...(csrfToken && { 'x-csrf-token': csrfToken }) }
            })
            
            if (res.ok) {
                toast.success("Document deleted")
                fetchData()
            }
        } catch (e) {
            toast.error("Delete failed")
        }
    }

    if (loading) return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
    if (!employee) return <div className="text-center py-20 text-slate-500">Employee not found.</div>

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/admin/employees" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </Link>
                {employee.avatar ? (
                    <img src={employee.avatar} alt={employee.name} className="w-16 h-16 rounded-full object-cover shadow-sm border border-slate-200" />
                ) : (
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
                        {employee.firstName ? employee.firstName.charAt(0) : employee.name.charAt(0)}
                    </div>
                )}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{employee.name}</h1>
                    <p className="text-slate-500 mt-1">Employee ID: {employee.employeeId}</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column: Basic Details */}
                <div className="space-y-6 lg:col-span-1">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-500" />
                            Personal Info
                        </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                                <p className="text-sm font-medium text-slate-900">{employee.email}</p>
                            </div>
                            {employee.phone && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</p>
                                    <p className="text-sm font-medium text-slate-900">{employee.phone}</p>
                                </div>
                            )}
                            {employee.address && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Address</p>
                                    <p className="text-sm font-medium text-slate-900">{employee.address}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Joined Date</p>
                                <p className="text-sm font-medium text-slate-900">{employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Role</p>
                                <p className="text-sm font-medium text-slate-900">{employee.role}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Department</p>
                                <p className="text-sm font-medium text-slate-900">{employee.department || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                                {employee.emailVerified ? (
                                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                                        <ShieldCheck className="w-3.5 h-3.5" /> Verified
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-full text-xs font-bold">
                                        Pending Verification
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Documents */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <FileText className="w-5 h-5 text-blue-500" />
                            <h2 className="text-xl font-bold text-slate-900">Document Management</h2>
                        </div>
                        
                        {/* Upload Form */}
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mb-8">
                            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Upload className="w-4 h-4 text-blue-500" />
                                Add Document to File
                            </h3>
                            <form onSubmit={handleUpload} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Document Type</label>
                                        <select 
                                            value={uploadType} 
                                            onChange={e => setUploadType(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        >
                                            {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={uploadTitle}
                                            onChange={e => setUploadTitle(e.target.value)}
                                            placeholder="e.g. 2026 Offer Letter"
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">File (PDF, JPG, PNG - Max 5MB)</label>
                                    <div className="flex gap-3">
                                        <input 
                                            type="file" 
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            className="flex-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-xl bg-white"
                                        />
                                        <button 
                                            type="submit"
                                            disabled={!selectedFile || uploading}
                                            className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                        
                        {/* Document List */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-slate-800 mb-2">Employee Documents ({documents.length})</h3>
                            {documents.length === 0 ? (
                                <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-200 rounded-2xl">
                                    No documents in this employee's file.
                                </div>
                            ) : (
                                documents.map(doc => {
                                    const typeLabel = DOC_TYPES.find(t => t.value === doc.type)?.label || doc.type
                                    
                                    return (
                                        <div key={doc.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-sm transition-shadow group">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-sm">{doc.name || doc.title}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{typeLabel}</span>
                                                        <span className="text-xs text-slate-400">Added {new Date(doc.createdAt).toLocaleDateString()}</span>
                                                        {doc.uploadedBy && (
                                                            <span className="text-xs text-slate-400">• By {doc.uploadedBy.details?.firstName || 'Admin'}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <a 
                                                    href={doc.fileUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Download"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </a>
                                                <button 
                                                    onClick={() => handleDeleteDoc(doc.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
