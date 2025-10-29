import { useState, useEffect } from 'react'

// 自定义Hook：获取当前用户信息
export const useUser = () => {
  const [userInfo, setUserInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 从本地存储中获取用户信息
    const loadUserInfo = () => {
      try {
        const storedUser = localStorage.getItem('userInfo')
        if (storedUser) {
          setUserInfo(JSON.parse(storedUser))
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserInfo()

    // 监听storage事件，当其他标签页修改用户信息时更新
    const handleStorageChange = (event) => {
      if (event.key === 'userInfo') {
        if (event.newValue) {
          setUserInfo(JSON.parse(event.newValue))
        } else {
          setUserInfo(null)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // 提供更新用户信息的方法
  const updateUserInfo = (newUserInfo) => {
    setUserInfo(newUserInfo)
    localStorage.setItem('userInfo', JSON.stringify(newUserInfo))
  }

  // 提供清除用户信息的方法（用于登出）
  const clearUserInfo = () => {
    setUserInfo(null)
    localStorage.removeItem('userInfo')
  }

  return {
    userInfo,
    loading,
    updateUserInfo,
    clearUserInfo,
    isLoggedIn: !!userInfo,
    isAdmin: userInfo?.user_type === 'admin'
  }
}