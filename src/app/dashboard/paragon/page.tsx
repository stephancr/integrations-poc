import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { signParagonToken } from "@/lib/jwt"
import { ParagonClient } from "@/components/paragon-client"

export default async function ParagonPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Always create and save a new Paragon token
  const paragonToken = signParagonToken(user.id)

  await supabase
    .from("profiles")
    .update({ paragon_token: paragonToken })
    .eq("id", user.id)

  return (
    <>
      <ParagonClient token={paragonToken} />
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Paragon</h1>
          <p className="text-muted-foreground">Select an integration from the sidebar to get started</p>
        </div>
      </div>
    </>
  )
}
