const DEFAULT_COMPANY_NAME = "Meta default"

const apiKey = process.env.MERGE_UNIFIED_API_KEY

export async function createMergeLinkToken(
    userId: string,
    userEmail: string,
    categories: string[],
    integration: string
): Promise<string | null> {
  try {
    const response = await fetch(
      "https://api.merge.dev/api/integrations/create-link-token",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          end_user_origin_id: userId,
          end_user_organization_name: DEFAULT_COMPANY_NAME,
          end_user_email_address: userEmail,
          categories: categories,
          integration: integration,
      }),
      }
    )

    if (!response.ok) {
      console.error("Failed to create Merge link token:", response.statusText)
      return null
    }

    const data = await response.json()
    return data.link_token || null
  } catch (error) {
    console.error("Error creating Merge link token:", error)
    return null
  }
}

export async function exchangeMergeAccountToken(publicToken: string): Promise<string | null> {
  try {
    const response = await fetch(
    `https://api.merge.dev/api/integrations/account-token/${publicToken}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error("Failed to exchange Merge public token:", response.statusText)
      return null
    }

    const data = await response.json()
    return data.account_token || null
  } catch (error) {
    console.error("Error fetching Merge registered users:", error)
    return null
  }
}

export async function getTickets(accountToken: string): Promise<any> {
  try {
    const response = await fetch(
      "https://api.merge.dev/api/ticketing/v1/tickets",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "X-Account-Token": accountToken,
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(JSON.stringify(errorData))
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching tickets from Merge:", error)
    throw error
  }
}

export async function getTicketsRaw(accountToken: string): Promise<any> {
  try {
    const response = await fetch(
      "https://api.merge.dev/api/ticketing/v1/passthrough",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "X-Account-Token": accountToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method: "GET",
          path: "/v2/tickets.json",
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(JSON.stringify(errorData))
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching raw tickets from Merge:", error)
    throw error
  }
}
