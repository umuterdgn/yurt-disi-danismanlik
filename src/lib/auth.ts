import { UserRole } from '@/generated/prisma'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  
  const userStr = localStorage.getItem('auth_user')
  if (!userStr) return null
  
  try {
    return JSON.parse(userStr) as AuthUser
  } catch {
    return null
  }
}

export function setAuthUser(user: AuthUser): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('auth_user', JSON.stringify(user))
}

export function clearAuthUser(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('auth_user')
}

export function hasRole(user: AuthUser | null, roles: UserRole[]): boolean {
  if (!user) return false
  return roles.includes(user.role)
}

export function canAccessRoute(user: AuthUser | null, requiredRoles: UserRole[]): boolean {
  return hasRole(user, requiredRoles)
}