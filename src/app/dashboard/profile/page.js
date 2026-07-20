"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { 
    User, Mail, Phone, MapPin, Briefcase, Calendar, 
    FileText, Upload, Download, Trash2, Loader2, CreditCard,
    ShieldCheck, Activity, X
} from "lucide-react"
import { useToast } from "@/components/Toast"

const DOC_TYPES = [
    { value: 'ID_PROOF', label: 'ID Proof (Aadhar/PAN/Passport)' },
    { value: 'OFFER_LETTER', label: 'Offer Letter' },
    { value: 'TAX_FORM', label: 'Tax Document' },
    { value: 'EDUCATION_CERTIFICATE', label: 'Certification / Degree' },
    { value: 'CONTRACT', label: 'Policy Agreement' },
    { value: 'OTHER', label: 'Other Document' }
]

export default function EmployeeProfile() {
    const toast = useToast()
    const [profile, setProfile] = useState(null)
    const [documents, setDocuments] = useState([])
    const [loading, setLoading] = useState(true)
    const [csrfToken, setCsrfToken] = useState(null)
    const fileInputRef = useRef(null)
    
    // Upload state
    const [uploading, setUploading] = useState(false)
    const [uploadType, setUploadType] = useState('ID_PROOF')
    const [uploadTitle, setUploadTitle] = useState('')
    const [selectedFile, setSelectedFile] = useState(null)

    // Edit Profile state
    const [showEditModal, setShowEditModal] = useState(false)
    const [editForm, setEditForm] = useState({})
    const [savingProfile, setSavingProfile] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem('csrfToken')
        if (token) setCsrfToken(token)
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            // Fetch profile data
            const resProfile = await fetch('/api/profile')
            if (resProfile.ok) {
                const data = await resProfile.json()
                setProfile(data.user)
                setEditForm(data.user)
            }
            
            // Fetch documents
            const resDocs = await fetch('/api/documents')
            if (resDocs.ok) {
                const data = await resDocs.json()
                setDocuments(data.documents || [])
            }
        } catch (e) {
            toast.error("Failed to load profile data")
        } finally {
            setLoading(false)
        }
    }

    const handleFileSelect = (e) => {
        const file = e.target.files[0]
        if (!file) return
        
        // Validation (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB")
            e.target.value = ''
            return
        }
        
        setSelectedFile(file)
        if (!uploadTitle) {
            // Auto-fill title based on filename without extension
            setUploadTitle(file.name.split('.').slice(0, -1).join('.'))
        }
    }

    const handleSaveProfile = async (e) => {
        e.preventDefault()
        setSavingProfile(true)
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                },
                body: JSON.stringify({
                    firstName: editForm.firstName,
                    lastName: editForm.lastName,
                    phone: editForm.phone,
                    address: editForm.address,
                    profilePic: editForm.profilePic
                })
            })
            if (res.ok) {
                toast.success("Profile updated successfully")
                setShowEditModal(false)
                fetchData()
            } else {
                const data = await res.json()
                toast.error(data.error || "Failed to update profile")
            }
        } catch (error) {
            toast.error("Error updating profile")
        } finally {
            setSavingProfile(false)
        }
    }

    const handleProfilePicChange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Image size must be less than 2MB")
            return
        }
        const reader = new FileReader()
        reader.onloadend = () => {
            setEditForm({ ...editForm, profilePic: reader.result })
        }
        reader.readAsDataURL(file)
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
            
            const res = await fetch('/api/documents', {
                method: 'POST',
                headers: {
                    ...(csrfToken && { 'x-csrf-token': csrfToken })
                },
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

    const handleDeleteDoc = async (id) => {
        if (!confirm("Are you sure you want to delete this document?")) return
        
        try {
            const res = await fetch(`/api/documents?id=${id}`, {
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

    if (loading) {
        return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
    }

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Profile</h1>
                <p className="text-slate-500 mt-1">Manage your personal information and documents</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column: Profile Card */}
                <div className="space-y-6 lg:col-span-1">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 text-center relative">
                        {profile?.profilePic ? (
                            <img src={profile.profilePic} alt="Profile" className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-white shadow-md" />
                        ) : (
                            <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
                                {profile?.firstName?.charAt(0) || profile?.email?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <h2 className="text-xl font-bold text-slate-900">
                            {profile?.firstName ? `${profile.firstName} ${profile.lastName}` : 'Employee'}
                        </h2>
                        <p className="text-slate-500 font-medium text-sm mb-4">{profile?.jobTitle || profile?.designation || 'Employee'}</p>
                        
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold mb-6">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Active Employee
                        </div>
                        
                        <div className="space-y-4 text-left border-t border-slate-100 pt-6">
                            <div className="flex items-center gap-3 text-slate-600 text-sm">
                                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="truncate">{profile?.email}</span>
                            </div>
                            {profile?.phone && (
                                <div className="flex items-center gap-3 text-slate-600 text-sm">
                                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span>{profile.phone}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3 text-slate-600 text-sm">
                                <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                                <span>{profile?.department || 'General'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600 text-sm">
                                <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                                <span>ID: {profile?.employeeId}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600 text-sm">
                                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                <span>Joined: {profile?.joiningDate || profile?.dateOfJoining ? new Date(profile.joiningDate || profile.dateOfJoining).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <button 
                                onClick={() => {
                                    setEditForm(profile || {})
                                    setShowEditModal(true)
                                }}
                                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-bold transition-colors border border-slate-200"
                            >
                                Edit Profile
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Documents */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <FileText className="w-5 h-5 text-blue-500" />
                            <h2 className="text-xl font-bold text-slate-900">My Documents</h2>
                        </div>
                        
                        {/* Upload Form */}
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mb-8">
                            <h3 className="text-sm font-bold text-slate-800 mb-4">Upload New Document</h3>
                            <form onSubmit={handleUpload} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Document Type</label>
                                        <select 
                                            value={uploadType} 
                                            onChange={e => setUploadType(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                                            placeholder="e.g. Aadhar Card"
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                            Upload
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                        
                        {/* Document List */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-slate-800 mb-2">Uploaded Files ({documents.length})</h3>
                            {documents.length === 0 ? (
                                <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-200 rounded-2xl">
                                    No documents uploaded yet.
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
                                                    <h4 className="font-bold text-slate-900 text-sm">{doc.name}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{typeLabel}</span>
                                                        <span className="text-xs text-slate-400">{new Date(doc.createdAt).toLocaleDateString()}</span>
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

            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div 
                        onClick={() => setShowEditModal(false)}
                        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                    />
                    <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <h2 className="text-xl font-bold text-slate-900">Edit Profile</h2>
                            <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <form id="editProfileForm" onSubmit={handleSaveProfile} className="space-y-4">
                                <div className="flex flex-col items-center mb-6">
                                    <div className="relative group cursor-pointer w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200">
                                        {editForm.profilePic ? (
                                            <img src={editForm.profilePic} className="w-full h-full object-cover" alt="Profile" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                                                <User className="w-8 h-8" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Upload className="w-6 h-6 text-white" />
                                        </div>
                                        <input type="file" accept="image/*" onChange={handleProfilePicChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">Click to change photo (Max 2MB)</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                                        <input required type="text" value={editForm.firstName || ''} onChange={e => setEditForm({...editForm, firstName: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                                        <input required type="text" value={editForm.lastName || ''} onChange={e => setEditForm({...editForm, lastName: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                    <input type="tel" value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                    <textarea rows="2" value={editForm.address || ''} onChange={e => setEditForm({...editForm, address: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                                </div>
                            </form>
                        </div>
                        
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                            <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors">
                                Cancel
                            </button>
                            <button form="editProfileForm" type="submit" disabled={savingProfile} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex justify-center">
                                {savingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Profile'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
