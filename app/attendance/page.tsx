"use client"
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@/redux/reducers'
import { fetchMyAttendanceToday, checkIn, checkOut } from '@/redux/actions/attendance'
import { Button } from '@/components/ui/button'

export default function AttendancePage(){
  const dispatch = useDispatch() as any
  const { record, loading } = useSelector((s: RootState) => s.attendance)
  useEffect(()=>{ dispatch(fetchMyAttendanceToday()) }, [dispatch])

  return (
    <div className="p-4 space-y-4">
      <div className="text-lg font-semibold">My Attendance (today)</div>
      {loading ? <div>Loading…</div> : (
        <div className="space-y-2">
          <div>Check-in: {record?.CheckInAt || '—'}</div>
          <div>Check-out: {record?.CheckOutAt || '—'}</div>
        </div>
      )}
      <div className="flex gap-2">
        <Button onClick={()=>dispatch(fetchMyAttendanceToday())}>Refresh</Button>
        <Button onClick={async()=>{ await checkIn(); dispatch(fetchMyAttendanceToday()); }}>Check In</Button>
        <Button variant="secondary" onClick={async()=>{ await checkOut(); dispatch(fetchMyAttendanceToday()); }}>Check Out</Button>
      </div>
    </div>
  )
}
