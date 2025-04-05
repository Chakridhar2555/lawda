"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      router.push("/dashboard")
    }
  }, [router])

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-JvRQj6C8JlmziOXvQ22LiabmHCro9Y.webp"
              alt="Get Home Realty Logo"
              width={400}
              height={120}
              className="w-full max-w-[400px] h-auto object-contain mb-6"
              priority
            />
          </div>
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">LOGIN</h1>
            <p className="text-gray-600">How to get started with Get Home Realty?</p>
          </div>
          <LoginForm />
        </div>
      </div>
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-red-500 to-red-600 items-center justify-center p-8">
        <div className="relative w-full max-w-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-red-400/50 to-red-600/50 rounded-3xl blur-xl"></div>
          <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-6 shadow-xl">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-01-28%20at%202.18.32%E2%80%AFAM-rNX3y3M5FLQhwU5OoE4esy1yIuAZ4r.png"
              alt="Welcome Image"
              width={600}
              height={600}
              className="w-full h-auto rounded-2xl"
              priority
            />
            <div className="absolute bottom-8 left-8 right-8 text-white">
              <h2 className="text-3xl font-bold mb-2">Very good works are waiting for you</h2>
              <p className="text-xl font-semibold text-white/90">Login Now!!!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

