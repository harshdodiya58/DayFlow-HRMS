/**
 * Input Validation Utilities
 * 
 * Centralized validation for all API inputs.
 * Used across all route handlers for consistent error handling.
 */

// Email validation
export function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(email)
}

// Phone validation (Indian format)
export function isValidPhone(phone) {
    const phoneRegex = /^[+]?[0-9]{10,15}$/
    return phoneRegex.test(phone.replace(/[\s-]/g, ''))
}

// PAN validation (Indian PAN card)
export function isValidPAN(pan) {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
    return panRegex.test(pan.toUpperCase())
}

// Aadhar validation (12 digits)
export function isValidAadhar(aadhar) {
    const aadharRegex = /^[0-9]{12}$/
    return aadharRegex.test(aadhar.replace(/[\s-]/g, ''))
}

// IFSC code validation
export function isValidIFSC(ifsc) {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/
    return ifscRegex.test(ifsc.toUpperCase())
}

// Bank account number validation (9-18 digits)
export function isValidBankAccount(account) {
    const accountRegex = /^[0-9]{9,18}$/
    return accountRegex.test(account)
}

// Date validation
export function isValidDate(dateStr) {
    const date = new Date(dateStr)
    return !isNaN(date.getTime())
}

// Date range validation
export function isValidDateRange(startDate, endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return start <= end
}

// String length validation
export function isValidLength(str, min, max) {
    if (typeof str !== 'string') return false
    return str.length >= min && str.length <= max
}

// Required fields validator
export function validateRequired(data, fields) {
    const missing = []
    for (const field of fields) {
        const value = data[field]
        if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
            missing.push(field)
        }
    }
    return {
        valid: missing.length === 0,
        missing,
        error: missing.length > 0 ? `Missing required fields: ${missing.join(', ')}` : null
    }
}

// Validate numeric within range
export function isValidNumber(value, min = -Infinity, max = Infinity) {
    const num = Number(value)
    return !isNaN(num) && num >= min && num <= max
}

// Validate enum value
export function isValidEnum(value, enumValues) {
    return enumValues.includes(value)
}

// Validate employee data for creation
export function validateEmployeeData(data) {
    const errors = []
    
    // Required fields
    const required = validateRequired(data, ['firstName', 'lastName', 'email', 'jobTitle', 'department', 'joiningDate'])
    if (!required.valid) {
        errors.push(required.error)
    }
    
    // Email format
    if (data.email && !isValidEmail(data.email)) {
        errors.push('Invalid email format')
    }
    
    // Phone format (if provided)
    if (data.phone && !isValidPhone(data.phone)) {
        errors.push('Invalid phone number format')
    }
    
    // Name length
    if (data.firstName && !isValidLength(data.firstName, 1, 50)) {
        errors.push('First name must be 1-50 characters')
    }
    if (data.lastName && !isValidLength(data.lastName, 1, 50)) {
        errors.push('Last name must be 1-50 characters')
    }
    
    // Joining date
    if (data.joiningDate && !isValidDate(data.joiningDate)) {
        errors.push('Invalid joining date')
    }
    
    // Financial validations (if provided)
    if (data.panNumber && !isValidPAN(data.panNumber)) {
        errors.push('Invalid PAN number format (e.g., ABCDE1234F)')
    }
    if (data.aadharNumber && !isValidAadhar(data.aadharNumber)) {
        errors.push('Invalid Aadhar number (must be 12 digits)')
    }
    if (data.ifscCode && !isValidIFSC(data.ifscCode)) {
        errors.push('Invalid IFSC code format')
    }
    if (data.bankAccountNo && !isValidBankAccount(data.bankAccountNo)) {
        errors.push('Invalid bank account number (9-18 digits)')
    }
    
    // Wage validation
    if (data.wage !== undefined) {
        if (!isValidNumber(data.wage, 0, 100000000)) {
            errors.push('Wage must be a positive number')
        }
    }
    
    return {
        valid: errors.length === 0,
        errors
    }
}

// Validate leave application
export function validateLeaveApplication(data) {
    const errors = []
    
    const required = validateRequired(data, ['type', 'startDate', 'endDate', 'reason'])
    if (!required.valid) {
        errors.push(required.error)
    }
    
    if (data.startDate && data.endDate && !isValidDateRange(data.startDate, data.endDate)) {
        errors.push('End date must be after or equal to start date')
    }
    
    if (data.startDate && new Date(data.startDate) < new Date(new Date().setHours(0, 0, 0, 0))) {
        errors.push('Cannot apply for leave on past dates')
    }
    
    if (data.reason && !isValidLength(data.reason, 5, 500)) {
        errors.push('Reason must be 5-500 characters')
    }
    
    const validLeaveTypes = ['SICK', 'PAID', 'UNPAID', 'CASUAL', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT', 'COMPENSATORY']
    if (data.type && !isValidEnum(data.type, validLeaveTypes)) {
        errors.push(`Invalid leave type. Must be one of: ${validLeaveTypes.join(', ')}`)
    }
    
    return {
        valid: errors.length === 0,
        errors
    }
}

// Validate ticket creation
export function validateTicketData(data) {
    const errors = []
    
    const required = validateRequired(data, ['category', 'subject', 'description'])
    if (!required.valid) {
        errors.push(required.error)
    }
    
    if (data.subject && !isValidLength(data.subject, 5, 200)) {
        errors.push('Subject must be 5-200 characters')
    }
    
    if (data.description && !isValidLength(data.description, 10, 5000)) {
        errors.push('Description must be 10-5000 characters')
    }
    
    const validCategories = ['PAYROLL_ISSUE', 'LEAVE_DISCREPANCY', 'ATTENDANCE_ISSUE', 'IT_SUPPORT', 'POLICY_QUESTION', 'BENEFITS', 'HARASSMENT_COMPLAINT', 'WORKPLACE_SAFETY', 'GENERAL_INQUIRY', 'OTHER']
    if (data.category && !isValidEnum(data.category, validCategories)) {
        errors.push(`Invalid category. Must be one of: ${validCategories.join(', ')}`)
    }
    
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    if (data.priority && !isValidEnum(data.priority, validPriorities)) {
        errors.push(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`)
    }
    
    return {
        valid: errors.length === 0,
        errors
    }
}

// Sanitize and trim string inputs
export function sanitizeString(str) {
    if (typeof str !== 'string') return str
    return str.trim()
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
}

// Sanitize an entire object
export function sanitizeObject(obj) {
    const sanitized = {}
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeString(value)
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
            sanitized[key] = sanitizeObject(value)
        } else {
            sanitized[key] = value
        }
    }
    return sanitized
}
