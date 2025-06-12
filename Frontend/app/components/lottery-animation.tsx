import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Sparkles, Zap } from "lucide-react"

export default function LotteryAnimation() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in-50">
      <Card className="w-96 mx-4">
        <CardContent className="text-center py-12">
          <div className="space-y-6">
            {/* Animation Icons */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-16 w-16 text-yellow-500 animate-pulse" />
              </div>
              <div className="flex items-center justify-center">
                <Loader2 className="h-20 w-20 text-purple-600 animate-spin" />
              </div>
            </div>

            {/* Lottery Text */}
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-900">🎲 Drawing in progress...</h3>
              <p className="text-gray-600">Please wait, the system is randomly selecting lucky winners</p>
            </div>

            {/* Animation Effects */}
            <div className="flex justify-center space-x-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-purple-600 rounded-full animate-bounce"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: "1s",
                  }}
                />
              ))}
            </div>

            {/* Lightning Effect */}
            <div className="flex justify-center">
              <Zap className="h-8 w-8 text-yellow-500 animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
