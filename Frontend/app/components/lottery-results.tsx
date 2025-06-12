"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, Medal, Award, Trophy, RotateCcw, Sparkles } from "lucide-react"

interface Participant {
  id: string
  name: string
}

interface Winners {
  [prizeName: string]: Participant[]
}

interface LotteryResultsProps {
  winners: Winners
  onReset: () => void
}

export default function LotteryResults({ winners, onReset }: LotteryResultsProps) {
  const getPrizeIcon = (prizeName: string) => {
    if (prizeName.includes("First Prize") || prizeName.includes("一等奖"))
      return <Crown className="h-8 w-8 text-yellow-500" />
    if (prizeName.includes("Second Prize") || prizeName.includes("二等奖"))
      return <Medal className="h-8 w-8 text-gray-400" />
    if (prizeName.includes("Third Prize") || prizeName.includes("三等奖"))
      return <Award className="h-8 w-8 text-amber-600" />
    return <Trophy className="h-8 w-8" />
  }

  const getPrizeColor = (prizeName: string) => {
    if (prizeName.includes("First Prize") || prizeName.includes("一等奖")) return "from-yellow-400 to-yellow-600"
    if (prizeName.includes("Second Prize") || prizeName.includes("二等奖")) return "from-gray-300 to-gray-500"
    if (prizeName.includes("Third Prize") || prizeName.includes("三等奖")) return "from-amber-400 to-amber-600"
    return "from-purple-400 to-purple-600"
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-1000">
      {/* Results Title */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="h-8 w-8 text-yellow-500" />
          <h2 className="text-3xl font-bold text-gray-900">🎉 Lottery Results 🎉</h2>
          <Sparkles className="h-8 w-8 text-yellow-500" />
        </div>
        <Button onClick={onReset} variant="outline" className="mb-6">
          <RotateCcw className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </div>

      {/* Winners Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(winners).map(([prizeName, prizeWinners]) => (
          <Card key={prizeName} className="overflow-hidden">
            <CardHeader className={`bg-gradient-to-r ${getPrizeColor(prizeName)} text-white`}>
              <CardTitle className="flex items-center gap-3">
                {getPrizeIcon(prizeName)}
                <div>
                  <div className="text-xl font-bold">{prizeName}</div>
                  <div className="text-sm opacity-90">{prizeWinners.length} winners</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {prizeWinners.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No winners</div>
              ) : (
                <div className="space-y-0">
                  {prizeWinners.map((winner, index) => (
                    <div
                      key={winner.id}
                      className={`p-4 border-b last:border-b-0 ${
                        index % 2 === 0 ? "bg-gray-50" : "bg-white"
                      } hover:bg-gray-100 transition-colors`}
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="secondary"
                          className="w-8 h-8 rounded-full flex items-center justify-center p-0"
                        >
                          {index + 1}
                        </Badge>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{winner.name}</div>
                          <div className="text-sm text-gray-500">ID: {winner.id}</div>
                        </div>
                        <div className="text-2xl">🎊</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Congratulations Message */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="text-center py-8">
          <div className="text-4xl mb-4">🎊🎉🎊</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Congratulations to all winners!</h3>
          <p className="text-gray-600">Thank you for participating in this Meshtastic lottery event</p>
        </CardContent>
      </Card>
    </div>
  )
}
