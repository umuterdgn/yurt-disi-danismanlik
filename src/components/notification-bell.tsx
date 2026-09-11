"use client"

import { useState } from "react"
import { Bell, CheckCircle, FileText, MessageSquare, Calendar, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { markNotificationAsRead } from "@/actions/document"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: Date
}

interface NotificationBellProps {
  userId: string
  initialNotifications?: Notification[]
}

export function NotificationBell({ userId, initialNotifications = [] }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(
    initialNotifications.filter(n => !n.isRead).length
  )

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK':
        return <CheckCircle className="w-4 h-4 text-blue-600" />
      case 'DOCUMENT':
        return <FileText className="w-4 h-4 text-orange-600" />
      case 'NOTE':
        return <MessageSquare className="w-4 h-4 text-purple-600" />
      case 'MEETING':
        return <Calendar className="w-4 h-4 text-green-600" />
      default:
        return <Bell className="w-4 h-4 text-gray-600" />
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markNotificationAsRead(notificationId)
    if (result.success) {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.isRead)
    for (const notification of unreadNotifications) {
      await handleMarkAsRead(notification.id)
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const notificationDate = new Date(date)
    const diffInHours = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Az önce'
    } else if (diffInHours < 24) {
      return `${diffInHours} saat önce`
    } else if (diffInHours < 48) {
      return 'Dün'
    } else {
      return notificationDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
    }
  }

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500"
            variant="default"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Bildirimler</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleMarkAllAsRead}
                    className="text-xs h-7"
                  >
                    Tümünü Okundu
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsOpen(false)}
                  className="h-7 w-7"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-80">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                  <Bell className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">Bildirim bulunmuyor</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.isRead ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-sm truncate">{notification.title}</p>
                            {!notification.isRead && (
                              <div className="w-2 h-2 rounded-full bg-blue-500 ml-2 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatTime(notification.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}