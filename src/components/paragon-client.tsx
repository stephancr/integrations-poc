"use client"

import { useEffect } from "react"

interface ParagonClientProps {
  token: string
}

export function ParagonClient({ token }: ParagonClientProps) {
  useEffect(() => {
    // Dynamically import Paragon SDK only on client side
    const initParagon = async () => {
      const { paragon } = await import('@useparagon/connect')

      const projectId = process.env.NEXT_PUBLIC_PARAGON_PROJECT_ID!

      console.log('Paragon authentication:', { projectId, token })

      // Initialize Paragon with the JWT token
      paragon.authenticate(
        projectId, // Your Paragon Project ID
        token // JWT user token
      )
    }

    initParagon()
  }, [token])

  return null
}
