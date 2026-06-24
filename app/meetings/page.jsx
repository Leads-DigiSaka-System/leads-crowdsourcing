"use client"

import { Suspense, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from "@/components/Navbar"
import UserMeetingsContent from "@/components/dashboard/meetings/UserMeetingsContent"
import { MeetingsLoading } from "@/components/dashboard/meetings/MeetingsLoading"
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

// Separate component that uses useSearchParams
function MeetingsPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [meetingData, setMeetingData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const page = parseInt(searchParams.get('page')) || 1

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    if (session.user?.role === 'admin') {
      router.push('/admin/meetings')
      return
    }

    fetchMeetings()
  }, [session, status, router, page])

  const fetchMeetings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/user/meetings?page=${page}&limit=5`)

      if (!response.ok) {
        throw new Error('Failed to fetch meetings')
      }

      const data = await response.json()
      setMeetingData(data)
    } catch (error) {
      console.error('Error fetching meetings:', error)
      setError('Failed to load meetings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <MeetingsLoading />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchMeetings}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="">
      <Navbar />

      <div className="container mt-4 mx-auto px-4 py-6 max-w-7xl">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Meeting Requests</h1>
            <p className="text-gray-600 mt-2">View and manage your meeting requests with researchers</p>
          </div>

          <div className="flex justify-end">
            <Link href="/meetings/contact-researcher">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Request New Meeting
              </Button>
            </Link>
          </div>
        </div>

        {meetingData && (
          <UserMeetingsContent
            initialData={meetingData.meetingRequests}
            userId={session.user.id}
            pagination={{
              currentPage: meetingData.currentPage,
              totalPages: meetingData.totalPages,
              totalCount: meetingData.totalCount
            }}
          />
        )}
      </div>
    </div>
  )
}

// Main page component with Suspense boundary
export default function UserMeetingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <MeetingsLoading />
        </div>
      </div>
    }>
      <MeetingsPageContent />
    </Suspense>
  )
}