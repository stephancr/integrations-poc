import { createClient } from "@/lib/supabase/server"

const PARAGON_PROJECT_ID = process.env.NEXT_PUBLIC_PARAGON_PROJECT_ID!
const PARAGON_MAGENTO_INTEGRATION_ID = process.env.NEXT_PUBLIC_PARAGON_MAGENTO_INTEGRATION_ID!
const PARAGON_MAGENTO_WORKFLOW_GET_PRODUCTS = "ec7e8f63-e680-40b6-a75c-5ea3c7c1a154"
const PARAGON_MAGENTO_WORKFLOW_GET_VARIANTS = "f814085c-5a83-4150-a641-504a9d514004"

async function getParagonToken(): Promise<string> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("No user found")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("paragon_token")
    .eq("id", user.id)
    .single()

  const paragonToken = profile?.paragon_token

  if (!paragonToken) {
    throw new Error("No Paragon token found")
  }

  return paragonToken
}

async function makeParagonRequest(
  url: string,
  options?: RequestInit
): Promise<any> {
  const paragonToken = await getParagonToken()

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${paragonToken}`,
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
export async function shopifyProxyGetProducts(): Promise<any> {
  return makeParagonRequest(
    `https://proxy.useparagon.com/projects/${PARAGON_PROJECT_ID}/sdk/proxy/shopify/admin/api/2025-10/products.json`
  )
}

export async function shopifyActionKitGetProducts(productIds: string): Promise<any> {
  return makeParagonRequest(
    `https://actionkit.useparagon.com/projects/${PARAGON_PROJECT_ID}/actions/#SHOPIFY_GET_PRODUCTS`,
    {
      method: "POST",
      body: JSON.stringify({
        action: "SHOPIFY_GET_PRODUCTS",
        parameters: {
          productIds,
        },
      }),
    }
  )
}

// Magento API wrappers
export async function magentoProxyGetProducts(): Promise<any> {
  return makeParagonRequest(
    `https://proxy.useparagon.com/projects/${PARAGON_PROJECT_ID}/sdk/proxy/custom/${PARAGON_MAGENTO_INTEGRATION_ID}/rest/V1/products?searchCriteria[pageSize]=20&searchCriteria[currentPage]=1`
  )
}

export async function magentoWorkflowGetProducts(): Promise<any> {
  return makeParagonRequest(
    `https://zeus.useparagon.com/projects/${PARAGON_PROJECT_ID}/sdk/triggers/${PARAGON_MAGENTO_WORKFLOW_GET_PRODUCTS}`,
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  )
}

export async function magentoWorkflowGetVariants(sku: string): Promise<any> {
  return makeParagonRequest(
    `https://zeus.useparagon.com/projects/${PARAGON_PROJECT_ID}/sdk/triggers/${PARAGON_MAGENTO_WORKFLOW_GET_VARIANTS}?sku=${encodeURIComponent(sku)}`,
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  )
}
