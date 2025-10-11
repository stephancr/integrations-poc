import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { signIntegrationAppToken } from "@/lib/jwt"

export default async function IntegrationAppPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single()

  // Always create and save a new Integration App token
  const integrationAppToken = signIntegrationAppToken(user.id, profile?.full_name || "User")

  await supabase
    .from("profiles")
    .update({ integration_app_token: integrationAppToken })
    .eq("id", user.id)

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Integration App</h1>
        <p className="text-muted-foreground">Select an integration from the sidebar to get started</p>
      </div>
    </div>
  )
}
