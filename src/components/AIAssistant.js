"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, X, Send, Loader2, Bot, User, HelpCircle, Sparkles } from "lucide-react"

const parseMarkdown = (text) => {
    if (!text) return { __html: '' }
    let html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n- (.*?)(?=\n|$)/g, '<br/>• $1')
        .replace(/\n\* (.*?)(?=\n|$)/g, '<br/>• $1')
        .replace(/\n/g, '<br/>')
    return { __html: html }
}

export default function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        { role: 'agent', content: 'Hi there! I am DayFlow AI. How can I assist you with your HR needs today?' }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef(null)

    const quickActions = [
        "What's my leave balance?",
        "Check my recent attendance",
        "What was my last net pay?",
        "How do I raise a ticket?"
    ]

    const handleQuickAction = (action) => {
        setInput(action)
        setTimeout(() => {
            const fakeEvent = { preventDefault: () => {} }
            handleSend(fakeEvent, action)
        }, 50)
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        if (isOpen) scrollToBottom()
    }, [messages, isOpen])

    const handleSend = async (e, overrideInput = null) => {
        e?.preventDefault()
        const textToSend = overrideInput || input
        if (!textToSend.trim() || isLoading) return

        const userMsg = { role: 'user', content: textToSend }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsLoading(true)

        try {
            const token = localStorage.getItem('csrfToken')
            const res = await fetch('/api/agent/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'x-csrf-token': token })
                },
                body: JSON.stringify({ 
                    message: userMsg.content,
                    history: messages // Pass history if we want context
                })
            })

            if (res.ok) {
                const data = await res.json()
                setMessages(prev => [...prev, { role: 'agent', content: data.response }])
            } else {
                setMessages(prev => [...prev, { role: 'agent', content: "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later." }])
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'agent', content: "Network error. Please try again." }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            {/* Floating Toggle Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-full shadow-2xl flex items-center justify-center transition-all ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
                <Bot className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 border-2 border-white"></span>
                </span>
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-6 right-6 z-50 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
                        style={{ height: '550px', maxHeight: '80vh' }}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">DayFlow Assistant</h3>
                                    <p className="text-[10px] text-blue-100 font-medium flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                        Online
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                            {messages.map((msg, idx) => (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                        msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'
                                    }`}>
                                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                                        msg.role === 'user' 
                                            ? 'bg-blue-600 text-white rounded-tr-sm' 
                                            : 'bg-white border border-slate-100 text-slate-700 shadow-sm rounded-tl-sm'
                                    }`}>
                                        <div dangerouslySetInnerHTML={parseMarkdown(msg.content)} />
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3 flex-row">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
                                        <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="bg-white border-t border-slate-100">
                            {/* Quick Actions */}
                            {messages.length === 1 && !isLoading && (
                                <div className="p-4 pb-0 flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
                                    {quickActions.map((action, i) => (
                                        <button 
                                            key={i}
                                            onClick={() => handleQuickAction(action)}
                                            className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors rounded-full text-xs font-medium border border-blue-100 shrink-0 flex items-center gap-1"
                                        >
                                            <Sparkles className="w-3 h-3" />
                                            {action}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="p-4">
                                <form onSubmit={handleSend} className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask HR something..."
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <button 
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                            <div className="mt-3 flex items-center justify-center gap-1 text-[10px] text-slate-400 font-medium">
                                <HelpCircle className="w-3 h-3" />
                                AI can make mistakes. Verify important info with HR.
                            </div>
                        </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
