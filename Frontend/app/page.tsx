"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Trophy, Zap, Crown, Medal, Award, WifiOff, CheckCircle, RefreshCw } from "lucide-react"
import ParticipantsList from "./components/participants-list"
import LotteryResults from "./components/lottery-results"
import LotteryAnimation from "./components/lottery-animation"

interface Participant {
  id: string
  name: string
}

interface PrizeLevel {
  [key: string]: number
}

interface Winners {
  [prizeName: string]: Participant[]
}

interface StatusData {
  participants: Participant[]
  participantCount: number
  keyword: string
  prizes: PrizeLevel
  inProgress: boolean
  results: Winners | null
  lastUpdate: number
}

export default function LotteryPage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [participantCount, setParticipantCount] = useState(0)
  const [keyword, setKeyword] = useState("我要抽奖")
  const [prizes, setPrizes] = useState<PrizeLevel>({})
  const [isDrawing, setIsDrawing] = useState(false)
  const [winners, setWinners] = useState<Winners | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const [mounted, setMounted] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(0)
  const [isPolling, setIsPolling] = useState(false)

  // 后端 API 地址
  const API_BASE_URL = "http://127.0.0.1:5000"

  useEffect(() => {
    setMounted(true)
  }, [])

  // 获取状态数据
  const fetchStatus = useCallback(async () => {
    if (!mounted) return

    try {
      setIsPolling(true)
      const response = await fetch(`${API_BASE_URL}/status`)

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data: StatusData = await response.json()

      // 只有当有更新时才更新状态
      if (data.lastUpdate !== lastUpdate) {
        console.log("📊 收到状态更新:", data)
        setParticipants(data.participants || [])
        setParticipantCount(data.participantCount || 0)
        setKeyword(data.keyword || "我要抽奖")
        setPrizes(data.prizes || {})
        setIsDrawing(data.inProgress)

        if (data.results && !data.inProgress) {
          setWinners(data.results)
        }

        setLastUpdate(data.lastUpdate)
        setConnectionStatus("connected")
      }
    } catch (error) {
      console.error("❌ 获取状态失败:", error)
      setConnectionStatus("disconnected")
    } finally {
      setIsPolling(false)
    }
  }, [mounted, lastUpdate, API_BASE_URL])

  // 定期轮询状态
  useEffect(() => {
    if (!mounted) return

    console.log("🔄 启动 HTTP 轮询...")

    // 立即获取一次状态
    fetchStatus()

    // 设置轮询间隔
    const intervalId = setInterval(() => {
      if (!isPolling) {
        fetchStatus()
      }
    }, 1000) // 每秒轮询一次

    return () => {
      clearInterval(intervalId)
    }
  }, [mounted, fetchStatus, isPolling])

  // 触发抽奖
  const triggerLottery = async () => {
    try {
      if (participantCount === 0) {
        console.warn("无法触发抽奖: 无参与者")
        return
      }

      console.log("🎯 触发抽奖")
      setIsDrawing(true)

      const response = await fetch(`${API_BASE_URL}/trigger-draw`, {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`)
      }

      // 抽奖已开始，状态将通过轮询更新
    } catch (error) {
      console.error("触发抽奖时出错:", error)
      setIsDrawing(false)
    }
  }

  // 重置抽奖
  const resetLottery = async () => {
    try {
      console.log("🔄 重置抽奖")

      const response = await fetch(`${API_BASE_URL}/reset`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      setWinners(null)
      setIsDrawing(false)

      // 立即获取最新状态
      fetchStatus()
    } catch (error) {
      console.error("重置抽奖时出错:", error)
    }
  }

  // 手动刷新状态
  const refreshStatus = () => {
    console.log("🔄 手动刷新状态")
    fetchStatus()
  }

  const getPrizeIcon = (prizeName: string) => {
    if (prizeName.includes("一等奖")) return <Crown className="h-6 w-6 text-yellow-500" />
    if (prizeName.includes("二等奖")) return <Medal className="h-6 w-6 text-gray-400" />
    if (prizeName.includes("三等奖")) return <Award className="h-6 w-6 text-amber-600" />
    return <Trophy className="h-6 w-6" />
  }

  // 防止服务端渲染不匹配
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载抽奖系统...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🎉 Meshtastic 多等级抽奖系统</h1>
          <p className="text-gray-600">
            发送 "<span className="font-semibold text-purple-600">{keyword}</span>" 参与抽奖
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              {connectionStatus === "connected" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : connectionStatus === "connecting" ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500"></div>
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  connectionStatus === "connected"
                    ? "text-green-600"
                    : connectionStatus === "connecting"
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
              >
                {connectionStatus === "connected"
                  ? "已连接"
                  : connectionStatus === "connecting"
                    ? "连接中..."
                    : "连接断开"}
              </span>
            </div>
            {connectionStatus === "connected" && (
              <Button onClick={refreshStatus} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新状态
              </Button>
            )}
          </div>
        </div>

        {/* 连接状态提示 */}
        {connectionStatus === "disconnected" && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                <WifiOff className="h-8 w-8 mx-auto mb-2" />
                <p className="font-medium">无法连接到后端服务器</p>
                <p className="text-sm mt-1">请确保后端服务器正在运行在 http://127.0.0.1:5000</p>
                <Button onClick={() => window.location.reload()} className="mt-3" size="sm">
                  刷新页面
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 抽奖动画 */}
        {isDrawing && <LotteryAnimation />}

        {/* 抽奖结果 */}
        {winners && <LotteryResults winners={winners} onReset={resetLottery} />}

        {/* 主要内容 */}
        {!isDrawing && !winners && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：统计信息 */}
            <div className="lg:col-span-1 space-y-6">
              {/* 参与者统计 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    参与统计
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">{participantCount}</div>
                    <p className="text-gray-600">当前参与人数</p>
                  </div>
                </CardContent>
              </Card>

              {/* 奖项设置 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    奖项设置
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(prizes).map(([prizeName, count]) => (
                    <div key={prizeName} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getPrizeIcon(prizeName)}
                        <span className="font-medium">{prizeName}</span>
                      </div>
                      <Badge variant="secondary">{count} 名</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* 抽奖按钮 */}
              <Card>
                <CardContent className="pt-6">
                  <Button
                    onClick={triggerLottery}
                    disabled={participantCount === 0 || connectionStatus !== "connected"}
                    className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
                  >
                    <Zap className="h-5 w-5 mr-2" />
                    {connectionStatus !== "connected"
                      ? "等待连接..."
                      : participantCount === 0
                        ? "等待参与者..."
                        : "开始抽奖"}
                  </Button>
                  {participantCount === 0 && connectionStatus === "connected" && (
                    <p className="text-sm text-gray-500 text-center mt-2">请等待用户发送 "{keyword}" 参与抽奖</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 右侧：参与者列表 */}
            <div className="lg:col-span-2">
              <ParticipantsList participants={participants} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
