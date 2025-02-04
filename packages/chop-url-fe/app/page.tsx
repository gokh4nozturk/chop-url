"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Copy, Link as LinkIcon, Check, Calendar, Hash, BarChart2 } from "lucide-react"

interface UrlStats {
  visitCount: number;
  lastAccessedAt: string | null;
  createdAt: string;
  expiresAt: string | null;
  visits: {
    visitedAt: string;
    ipAddress: string | null;
    userAgent: string | null;
    referrer: string | null;
  }[];
}

export default function Home() {
  const [url, setUrl] = useState("")
  const [customSlug, setCustomSlug] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [shortenedUrl, setShortenedUrl] = useState("")
  const [qrCode, setQrCode] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState<UrlStats | null>(null)
  const [showStats, setShowStats] = useState(false)

  useEffect(() => {
    // Reset copied state after 2 seconds
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false)
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [copied])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setStats(null)
    setShowStats(false)

    try {
      // Basic URL validation
      let urlToShorten = url.trim()
      if (!urlToShorten.startsWith('http://') && !urlToShorten.startsWith('https://')) {
        urlToShorten = 'https://' + urlToShorten
      }

      // Don't allow shortening our own URLs
      if (urlToShorten.includes('chop-url.vercel.app') || urlToShorten.includes('chop-url-backend.gokhaanozturk.workers.dev')) {
        throw new Error("Cannot shorten URLs from this domain")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shorten`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: urlToShorten,
          customSlug: customSlug || undefined,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to shorten URL")
      }

      const data = await response.json()
      setShortenedUrl(data.shortUrl)
      setQrCode(data.qrCode)
    } catch (error) {
      console.error("Error shortening URL:", error)
      setError(error instanceof Error ? error.message : "Failed to shorten URL. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shortenedUrl)
      setCopied(true)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const fetchStats = async () => {
    if (!shortenedUrl) return;

    try {
      const shortId = shortenedUrl.split('/').pop()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats/${shortId}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch stats")
      }

      const data = await response.json()
      setStats(data)
      setShowStats(true)
    } catch (error) {
      console.error("Error fetching stats:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch stats")
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-zinc-900 to-black">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Chop URL</h1>
          <p className="text-zinc-400">Make your long URLs short and sweet</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="relative">
              <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <Input
                type="url"
                placeholder="Enter your long URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-10 pr-4 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 w-full"
                required
                autoFocus
              />
            </div>

            <div className="relative">
              <Hash className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <Input
                type="text"
                placeholder="Custom slug (optional)"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
                className="pl-10 pr-4 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 w-full"
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <Input
                type="datetime-local"
                placeholder="Expires at (optional)"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="pl-10 pr-4 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 w-full"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? "Chopping..." : "Chop!"}
          </Button>

          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </form>

        {shortenedUrl && (
          <div className="space-y-4">
            <div className="p-4 bg-zinc-800 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-green-400 truncate flex-1 mr-2">{shortenedUrl}</p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyToClipboard}
                    className="hover:bg-zinc-700 transition-all duration-200"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4 text-zinc-400" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={fetchStats}
                    className="hover:bg-zinc-700 transition-all duration-200"
                  >
                    <BarChart2 className="h-4 w-4 text-zinc-400" />
                  </Button>
                </div>
              </div>
            </div>

            {qrCode && (
              <div className="p-4 bg-zinc-800 rounded-lg">
                <p className="text-zinc-400 mb-2">QR Code</p>
                <div className="flex justify-center">
                  <img
                    src={qrCode}
                    alt="QR Code"
                    width={200}
                    height={200}
                    className="rounded-lg"
                  />
                </div>
              </div>
            )}

            {showStats && stats && (
              <div className="p-4 bg-zinc-800 rounded-lg">
                <p className="text-zinc-400 mb-4">Statistics</p>
                <div className="space-y-2">
                  <p className="text-white">Total Visits: {stats.visitCount}</p>
                  <p className="text-white">Created: {new Date(stats.createdAt).toLocaleString()}</p>
                  {stats.lastAccessedAt && (
                    <p className="text-white">Last Accessed: {new Date(stats.lastAccessedAt).toLocaleString()}</p>
                  )}
                  {stats.expiresAt && (
                    <p className="text-white">Expires: {new Date(stats.expiresAt).toLocaleString()}</p>
                  )}
                  
                  {stats.visits.length > 0 && (
                    <div className="mt-4">
                      <p className="text-zinc-400 mb-2">Recent Visits</p>
                      <div className="space-y-2">
                        {stats.visits.map((visit, index) => (
                          <div key={index} className="text-sm text-zinc-300">
                            {new Date(visit.visitedAt).toLocaleString()}
                            {visit.referrer && (
                              <span className="text-zinc-400 ml-2">from {visit.referrer}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
