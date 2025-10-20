import { createClient } from "@/lib/supabase/server"

async function getIntegrationAppToken(): Promise<string> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("No user found")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("integration_app_token")
    .eq("id", user.id)
    .single()

  const integrationAppToken = profile?.integration_app_token

  if (!integrationAppToken) {
    throw new Error("No Integration App token found")
  }

  return integrationAppToken
}

async function makeIntegrationAppRequest(
  url: string,
  options?: RequestInit
): Promise<any> {
  const integrationAppToken = await getIntegrationAppToken()

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${integrationAppToken}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(JSON.stringify(data, null, 2))
  }

  return data
}

// Shopify API wrappers
export async function shopifyGetProducts(cursor?: string): Promise<any> {
  return makeIntegrationAppRequest(
    "https://api.integration.app/connections/shopify/actions/get-products/run",
    {
      method: "POST",
      body: JSON.stringify({
        cursor: cursor || undefined,
      }),
    }
  )
}

export async function shopifyGetProductsRaw(): Promise<any> {
  return makeIntegrationAppRequest(
    "https://api.integration.app/data-source-instances/68e693fc1e99923374fe4c62/collection/list",
    {
      method: "POST",
    }
  )
}

// Magento API wrappers
export async function magentoGetProducts(cursor?: string): Promise<any> {
  return makeIntegrationAppRequest(
    "https://api.integration.app/connections/adobe-commerce/actions/get-products/run",
    {
      method: "POST",
      body: JSON.stringify({
        cursor: cursor || undefined,
      }),
    }
  )
}

export async function magentoGetProductsRaw(): Promise<any> {
  return makeIntegrationAppRequest(
    "https://api.integration.app/data-source-instances/68e6c7ba8b353b15c50e30c0/collection/list",
    {
      method: "POST",
    }
  )
}
