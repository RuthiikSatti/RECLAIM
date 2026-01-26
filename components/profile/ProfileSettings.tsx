'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import UsernameInput from '@/components/auth/UsernameInput'

interface ProfileSettingsProps {
  currentDisplayName: string | null
  userId: string
  currentCollegeName?: string | null
  currentCollegeAddress?: string | null
}

export default function ProfileSettings({
  currentDisplayName,
  userId,
  currentCollegeName = '',
  currentCollegeAddress = ''
}: ProfileSettingsProps) {
  const [username, setUsername] = useState(currentDisplayName || '')
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(false)
  const [collegeName, setCollegeName] = useState(currentCollegeName || '')
  const [collegeAddress, setCollegeAddress] = useState(currentCollegeAddress || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Check if username hasn't changed
    if (username.toLowerCase() === currentDisplayName?.toLowerCase()) {
      setMessage({ type: 'error', text: 'Please enter a different username' })
      setLoading(false)
      return
    }

    // Check if username is available
    if (!isUsernameAvailable && username.toLowerCase() !== currentDisplayName?.toLowerCase()) {
      setMessage({ type: 'error', text: 'Please choose an available username' })
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/username/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update username')
      }

      setMessage({ type: 'success', text: 'Username updated successfully!' })
      // Refresh the page to show updated name
      setTimeout(() => window.location.reload(), 1500)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update username' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCollege = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Check if values haven't changed
    if (collegeName === currentCollegeName && collegeAddress === currentCollegeAddress) {
      setMessage({ type: 'error', text: 'No changes detected' })
      setLoading(false)
      return
    }

    // Validate required fields
    if (!collegeName.trim()) {
      setMessage({ type: 'error', text: 'College name is required' })
      setLoading(false)
      return
    }

    if (!collegeAddress.trim()) {
      setMessage({ type: 'error', text: 'College address is required' })
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          college_name: collegeName.trim(),
          college_address: collegeAddress.trim()
        })
        .eq('id', userId)

      if (error) throw error

      setMessage({ type: 'success', text: 'College information updated successfully!' })
      setTimeout(() => window.location.reload(), 1500)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update college information' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Validation
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      setLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      setLoading(false)
      return
    }

    try {
      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Password updated successfully!' })
      // Clear form
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update password' })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    // Confirm before logging out
    const confirmed = window.confirm('Are you sure you want to log out?')
    if (!confirmed) return

    setLogoutLoading(true)
    setMessage(null)

    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()

      if (error) throw error

      // Clear localStorage cart
      localStorage.removeItem('reclaim_cart')

      // Show success message briefly before redirect
      setMessage({ type: 'success', text: 'Logged out successfully!' })

      // Redirect to home page after brief delay
      setTimeout(() => {
        router.push('/')
      }, 500)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to log out' })
      setLogoutLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h2>

      {/* Message Display */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Update Username */}
      <form onSubmit={handleUpdateUsername} className="mb-8 pb-8 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Username</h3>
        <div className="max-w-md">
          <UsernameInput
            value={username}
            onChange={setUsername}
            onAvailabilityChange={setIsUsernameAvailable}
            required={true}
          />
          <p className="mt-2 text-sm text-gray-600">
            Current username: <span className="font-medium">{currentDisplayName}</span>
          </p>
          <button
            type="submit"
            disabled={loading || username === currentDisplayName || (!isUsernameAvailable && username.toLowerCase() !== currentDisplayName?.toLowerCase())}
            className="mt-4 bg-ume-indigo text-white px-6 py-2 rounded-full hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Updating...' : 'Update Username'}
          </button>
        </div>
      </form>

      {/* Update College Information */}
      <form onSubmit={handleUpdateCollege} className="mb-8 pb-8 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">College Information</h3>
        <div className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              College Name
            </label>
            <input
              type="text"
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-full px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., University of the Cumberlands"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              College Address
            </label>
            <input
              type="text"
              value={collegeAddress}
              onChange={(e) => setCollegeAddress(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-full px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 6178 College Station Dr, Williamsburg, KY 40769"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-ume-indigo text-white px-6 py-2 rounded-full hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Updating...' : 'Update College Info'}
          </button>
        </div>
      </form>

      {/* Update Password */}
      <form onSubmit={handleUpdatePassword} className="pb-8 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
        <div className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-gray-300 rounded-full px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter new password (min 6 characters)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-gray-300 rounded-full px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Confirm new password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-ume-indigo text-white px-6 py-2 rounded-full hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>

      {/* Logout Section */}
      <div className="pt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
        <div className="max-w-md">
          <p className="text-sm text-gray-600 mb-4">
            Log out of your account. You'll need to sign in again to access your profile.
          </p>
          <button
            onClick={handleLogout}
            disabled={logoutLoading}
            className="w-full bg-white text-ume-pink border border-ume-pink py-3 px-6 rounded-full font-semibold hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {logoutLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging out...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Log Out
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
