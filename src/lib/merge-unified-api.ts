const DEFAULT_COMPANY_NAME = "Meta default"

const apiKey = process.env.MERGE_UNIFIED_API_KEY

async function makeMergeUnifiedRequest(
  url: string,
  options?: RequestInit,
  accountToken?: string
): Promise<any> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    ...options?.headers as Record<string, string>,
  }

  if (accountToken) {
    headers["X-Account-Token"] = accountToken
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(JSON.stringify(data, null, 2))
  }

  return data
}

export async function mergeCreateLinkToken(
    userId: string,
    userEmail: string,
    categories: string[],
    integration: string
): Promise<string | null> {
  try {
    const data = await makeMergeUnifiedRequest(
      "https://api.merge.dev/api/integrations/create-link-token",
      {
        method: "POST",
        body: JSON.stringify({
          end_user_origin_id: userId,
          end_user_organization_name: DEFAULT_COMPANY_NAME,
          end_user_email_address: userEmail,
          categories: categories,
          integration: integration,
        }),
      }
    )

    return data.link_token || null
  } catch (error) {
    console.error("Error creating Merge link token:", error)
    return null
  }
}

export async function mergeExchangeAccountToken(publicToken: string): Promise<string | null> {
  try {
    const data = await makeMergeUnifiedRequest(
      `https://api.merge.dev/api/integrations/account-token/${publicToken}`,
      {
        method: "GET",
      }
    )

    return data.account_token || null
  } catch (error) {
    console.error("Error exchanging Merge account token:", error)
    return null
  }
}

export async function mergeGetTickets(accountToken: string): Promise<any> {
  try {
    const data = await makeMergeUnifiedRequest(
      "https://api.merge.dev/api/ticketing/v1/tickets",
      {
        method: "GET",
      },
      accountToken
    )

    return data
  } catch (error) {
    console.error("Error fetching tickets from Merge:", error)
    throw error
  }
}

export async function mergeGetTicketsRaw(accountToken: string): Promise<any> {
  try {
    const data = await makeMergeUnifiedRequest(
      "https://api.merge.dev/api/ticketing/v1/passthrough",
      {
        method: "POST",
        body: JSON.stringify({
          method: "GET",
          path: "/v2/tickets.json",
        }),
      },
      accountToken
    )

    return data
  } catch (error) {
    console.error("Error fetching raw tickets from Merge:", error)
    throw error
  }
}
