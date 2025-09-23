import React, { useState } from 'react'
import { RegistrationRequest } from '@leadership-training/shared'
import { sessionService } from '../services/session.service'
import './RegistrationForm.css'

interface RegistrationFormProps {
  sessionId: string
  onRegistrationSuccess?: () => void
}

const RegistrationForm = ({ sessionId, onRegistrationSuccess }: RegistrationFormProps) => {
  const [formData, setFormData] = useState<RegistrationRequest>({
    name: '',
    email: '',
    referredBy: ''
  })
  const [errors, setErrors] = useState<Partial<RegistrationRequest>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')

  const validateForm = (): boolean => {
    const newErrors: Partial<RegistrationRequest> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear error for this field when user starts typing
    if (errors[name as keyof RegistrationRequest]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const registrationData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        referredBy: formData.referredBy?.trim() || undefined
      }

      await sessionService.registerForSession(sessionId, registrationData)

      setSubmitStatus('success')
      setSubmitMessage('Registration successful! You will receive a confirmation email shortly.')

      // Reset form
      setFormData({
        name: '',
        email: '',
        referredBy: ''
      })

      if (onRegistrationSuccess) {
        onRegistrationSuccess()
      }

    } catch (error: any) {
      console.error('Registration error:', error)
      setSubmitStatus('error')

      if (error.response?.status === 409) {
        setSubmitMessage('You are already registered for this session.')
      } else if (error.response?.status === 400) {
        setSubmitMessage(error.response.data.message || 'Invalid registration data. Please check your information.')
      } else if (error.response?.status === 404) {
        setSubmitMessage('Session not found or registration is closed.')
      } else {
        setSubmitMessage('Registration failed. Please try again later.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitStatus === 'success') {
    return (
      <div className="registration-form-container">
        <div className="registration-success">
          <div className="success-icon">✓</div>
          <h3>Registration Confirmed!</h3>
          <p>{submitMessage}</p>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSubmitStatus('idle')
              setSubmitMessage('')
            }}
          >
            Register Someone Else
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="registration-form-container">
      <div className="form-header">
        <h3>Register for this Session</h3>
        <p>Secure your spot in this leadership training session</p>
      </div>

      <form onSubmit={handleSubmit} className="registration-form" noValidate>
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`form-input ${errors.name ? 'error' : ''}`}
            placeholder="Enter your full name"
            required
            disabled={isSubmitting}
          />
          {errors.name && (
            <span className="error-message" role="alert">
              {errors.name}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`form-input ${errors.email ? 'error' : ''}`}
            placeholder="Enter your email address"
            required
            disabled={isSubmitting}
          />
          {errors.email && (
            <span className="error-message" role="alert">
              {errors.email}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="referredBy" className="form-label">
            Referred By (Optional)
          </label>
          <input
            type="text"
            id="referredBy"
            name="referredBy"
            value={formData.referredBy}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Who referred you to this session?"
            disabled={isSubmitting}
          />
        </div>

        {submitStatus === 'error' && (
          <div className="error-alert" role="alert">
            {submitMessage}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-full-width"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="loading-spinner small" aria-hidden="true"></span>
              Registering...
            </>
          ) : (
            'Register Now'
          )}
        </button>

        <p className="form-note">
          * Required fields. By registering, you agree to receive updates about this training session.
        </p>
      </form>
    </div>
  )
}

export default RegistrationForm