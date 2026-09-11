'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface PendingUser {
  id: string
  email: string
  name: string
  role: string
  isApproved: boolean
  createdAt: string
}

export default function PendingApprovalsPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPendingUsers()
  }, [])

  const fetchPendingUsers = async () => {
    try {
      const response = await fetch('/api/admin/approve-user')
      const data = await response.json()

      if (data.success) {
        setPendingUsers(data.users)
      } else {
        setError('Kullanıcılar yüklenirken hata oluştu')
      }
    } catch (err) {
      setError('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId: string) => {
    setApproving(userId)
    setError('')

    try {
      const response = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      const data = await response.json()

      if (data.success) {
        // Remove the approved user from the list
        setPendingUsers(pendingUsers.filter(user => user.id !== userId))
      } else {
        setError(data.error || 'Onaylama başarısız')
      }
    } catch (err) {
      setError('Bir hata oluştu')
    } finally {
      setApproving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Onay Bekleyen Öğrenciler</h1>
        <p className="text-gray-600 mt-1">
          Kayıt olan ancak henüz onaylanmamış öğrencileri yönetin
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {pendingUsers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-500">
            Onay bekleyen öğrenci bulunmamaktadır.
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ad Soyad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  E-posta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kayıt Tarihi
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.role}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleApprove(user.id)}
                      disabled={approving === user.id}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      {approving === user.id ? 'Onaylanıyor...' : 'Onayla'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}