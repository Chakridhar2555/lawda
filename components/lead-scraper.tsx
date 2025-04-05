"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

export function LeadScraper() {
  const [url, setUrl] = useState("")
  const [scraping, setScraping] = useState(false)
  const { toast } = useToast()

  const handleScrape = async () => {
    setScraping(true)
    try {
      // In a real application, this would be a call to your backend scraping service
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        throw new Error("Scraping failed")
      }

      const data = await response.json()
      toast({
        title: "Scraping Successful",
        description: `${data.leadsCount} leads scraped and added to the database.`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Scraping Failed",
        description: "There was an error while scraping leads. Please try again.",
      })
    } finally {
      setScraping(false)
    }
  }

  return (
    <div className="flex space-x-2">
      <Input
        type="url"
        placeholder="Enter MLS URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="flex-grow"
      />
      <Button onClick={handleScrape} disabled={scraping || !url}>
        {scraping ? "Scraping..." : "Scrape Leads"}
      </Button>
    </div>
  )
}

