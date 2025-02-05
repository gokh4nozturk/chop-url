"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Copy, Link as LinkIcon, Check, Hash, BarChart2, Download, Share2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
          customSlug: customSlug || undefined
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
    <main className="flex-1">
      <div className="container mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-8 md:py-12 lg:py-16">
        <div className="flex w-full flex-col justify-center space-y-6 sm:w-[350px] md:w-[550px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Chop URL
            </h1>
            <p className="mx-auto max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Make your long URLs short and sweet
            </p>
          </div>

          <Card className="border shadow-sm">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="url"
                      placeholder="Enter your long URL"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="pl-10 h-12 text-base"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="relative">
                    <Hash className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Custom slug (optional)"
                      value={customSlug}
                      onChange={(e) => setCustomSlug(e.target.value)}
                      className="pl-10 h-12 text-base"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full text-base"
                  disabled={isLoading}
                >
                  {isLoading ? "Chopping..." : "Chop!"}
                </Button>

                {error && (
                  <p className="text-sm text-destructive mt-2 text-center">{error}</p>
                )}
              </form>
            </CardContent>
          </Card>

          {shortenedUrl && (
            <div className="space-y-4 animate-in fade-in-50 duration-500">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between space-x-2">
                    <p className="text-base font-medium truncate flex-1">{shortenedUrl}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={copyToClipboard}
                        className="h-10 w-10"
                      >
                        {copied ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={fetchStats}
                        className="h-10 w-10"
                      >
                        <BarChart2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {qrCode && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-medium flex items-center justify-between">
                      QR Code
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = qrCode
                            link.download = 'qr-code.png'
                            link.click()
                          }}
                          className="h-10 w-10"
                        >
                          <Download className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                                title: 'QR Code',
                                text: 'Check out this QR code for my shortened URL!',
                                url: shortenedUrl
                              })
                            }
                          }}
                          className="h-10 w-10"
                        >
                          <Share2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center bg-white p-6 rounded-lg">
                      <img
                        src={qrCode}
                        alt="QR Code"
                        className="h-[250px] w-[250px] object-contain"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {showStats && stats && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-medium">Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Visit Count</p>
                        <p className="text-3xl font-bold">{stats.visitCount}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Created At</p>
                        <p className="text-base">
                          {new Date(stats.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {stats.lastAccessedAt && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Last Accessed</p>
                          <p className="text-base">
                            {new Date(stats.lastAccessedAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {stats.expiresAt && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Expires At</p>
                          <p className="text-base">
                            {new Date(stats.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
