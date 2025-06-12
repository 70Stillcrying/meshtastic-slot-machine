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
  const [keyword, setKeyword] = useState("I want to join lottery")
  const [prizes, setPrizes] = useState<PrizeLevel>({})
  const [isDrawing, setIsDrawing] = useState(false)
  const [winners, setWinners] = useState<Winners | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const [mounted, setMounted] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(0)
  const [isPolling, setIsPolling] = useState(false)

  // Backend API URL
  const API_BASE_URL = "http://127.0.0.1:5000"

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch status data
  const fetchStatus = useCallback(async () => {
    if (!mounted) return

    try {
      setIsPolling(true)
      const response = await fetch(`${API_BASE_URL}/status`)

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data: StatusData = await response.json()

      // Only update state when there are updates
      if (data.lastUpdate !== lastUpdate) {
        console.log("📊 Received status update:", data)
        setParticipants(data.participants || [])
        setParticipantCount(data.participantCount || 0)
        setKeyword(data.keyword || "I want to join lottery")
        setPrizes(data.prizes || {})
        setIsDrawing(data.inProgress)

        if (data.results && !data.inProgress) {
          setWinners(data.results)
        }

        setLastUpdate(data.lastUpdate)
        setConnectionStatus("connected")
      }
    } catch (error) {
      console.error("❌ Failed to fetch status:", error)
      setConnectionStatus("disconnected")
    } finally {
      setIsPolling(false)
    }
  }, [mounted, lastUpdate, API_BASE_URL])

  // Regular polling for status
  useEffect(() => {
    if (!mounted) return

    console.log("🔄 Starting HTTP polling...")

    // Fetch status immediately
    fetchStatus()

    // Set polling interval
    const intervalId = setInterval(() => {
      if (!isPolling) {
        fetchStatus()
      }
    }, 1000) // Poll every second

    return () => {
      clearInterval(intervalId)
    }
  }, [mounted, fetchStatus, isPolling])

  // Trigger lottery
  const triggerLottery = async () => {
    try {
      if (participantCount === 0) {
        console.warn("Cannot trigger lottery: no participants")
        return
      }

      console.log("🎯 Triggering lottery")
      setIsDrawing(true)

      const response = await fetch(`${API_BASE_URL}/trigger-draw`, {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`)
      }

      // Lottery has started, status will be updated through polling
    } catch (error) {
      console.error("Error triggering lottery:", error)
      setIsDrawing(false)
    }
  }

  // Reset lottery
  const resetLottery = async () => {
    try {
      console.log("🔄 Resetting lottery")

      const response = await fetch(`${API_BASE_URL}/reset`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      setWinners(null)
      setIsDrawing(false)

      // Fetch latest status immediately
      fetchStatus()
    } catch (error) {
      console.error("Error resetting lottery:", error)
    }
  }

  // Manual refresh status
  const refreshStatus = () => {
    console.log("🔄 Manually refreshing status")
    fetchStatus()
  }

  const getPrizeIcon = (prizeName: string) => {
    if (prizeName.includes("First Prize") || prizeName.includes("一等奖"))
      return <Crown className="h-6 w-6 text-yellow-500" />
    if (prizeName.includes("Second Prize") || prizeName.includes("二等奖"))
      return <Medal className="h-6 w-6 text-gray-400" />
    if (prizeName.includes("Third Prize") || prizeName.includes("三等奖"))
      return <Award className="h-6 w-6 text-amber-600" />
    return <Trophy className="h-6 w-6" />
  }

  // Prevent server-side rendering mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lottery system...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🎉 Meshtastic Multi-Level Lottery System</h1>
          <p className="text-gray-600">
            Send "<span className="font-semibold text-purple-600">{keyword}</span>" to participate in lottery
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
                  ? "Connected"
                  : connectionStatus === "connecting"
                    ? "Connecting..."
                    : "Disconnected"}
              </span>
            </div>
            {connectionStatus === "connected" && (
              <Button onClick={refreshStatus} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
            )}
          </div>
        </div>

        {/* Connection Status Alert */}
        {connectionStatus === "disconnected" && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                <WifiOff className="h-8 w-8 mx-auto mb-2" />
                <p className="font-medium">Unable to connect to backend server</p>
                <p className="text-sm mt-1">Please ensure the backend server is running at http://127.0.0.1:5000</p>
                <Button onClick={() => window.location.reload()} className="mt-3" size="sm">
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lottery Animation */}
        {isDrawing && <LotteryAnimation />}

        {/* Lottery Results */}
        {winners && <LotteryResults winners={winners} onReset={resetLottery} />}

        {/* Main Content */}
        {!isDrawing && !winners && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Statistics */}
            <div className="lg:col-span-1 space-y-6">
              {/* Participant Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Participation Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">{participantCount}</div>
                    <p className="text-gray-600">Current participants</p>
                  </div>
                </CardContent>
              </Card>

              {/* Prize Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Prize Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(prizes).map(([prizeName, count]) => (
                    <div key={prizeName} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getPrizeIcon(prizeName)}
                        <span className="font-medium">{prizeName}</span>
                      </div>
                      <Badge variant="secondary">{count} winners</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Lottery Button */}
              <Card>
                <CardContent className="pt-6">
                  <Button
                    onClick={triggerLottery}
                    disabled={participantCount === 0 || connectionStatus !== "connected"}
                    className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
                  >
                    <Zap className="h-5 w-5 mr-2" />
                    {connectionStatus !== "connected"
                      ? "Waiting for connection..."
                      : participantCount === 0
                        ? "Waiting for participants..."
                        : "Start Lottery"}
                  </Button>
                  {participantCount === 0 && connectionStatus === "connected" && (
                    <p className="text-sm text-gray-500 text-center mt-2">
                      Please wait for users to send "{keyword}" to participate in lottery
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Participants List */}
            <div className="lg:col-span-2">
              <ParticipantsList participants={participants} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
