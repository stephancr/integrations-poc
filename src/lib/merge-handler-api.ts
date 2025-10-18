const DEFAULT_COMPANY_ID = "2c9b228f-da0f-46fd-9c7b-f97031ce0985-default"
const DEFAULT_COMPANY_NAME = "Meta default"

const apiKey = process.env.MERGE_API_KEY

export async function getMergeRegisteredUserId(userId: string): Promise<string | null> {
  try {
    const response = await fetch("https://ah-api.merge.dev/api/v1/registered-users", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error("Failed to fetch Merge registered users:", response.statusText)
      return null
    }

    const data = await response.json()

    // Iterate through results to find matching user
    if (data.results && Array.isArray(data.results)) {
      for (const registeredUser of data.results) {
        if (registeredUser.origin_user_id === userId) {
          return registeredUser.id
        }
      }
    }

    // No match found
    return null
  } catch (error) {
    console.error("Error fetching Merge registered users:", error)
    return null
  }
}

export async function createMergeRegisteredUser(
  userId: string,
  userEmail: string
): Promise<string | null> {
  try {
    const response = await fetch("https://ah-api.merge.dev/api/v1/registered-users", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        origin_user_id: userId,
        origin_user_name: userEmail,
        shared_credential_group: {
          origin_company_id: DEFAULT_COMPANY_ID,
          origin_company_name: DEFAULT_COMPANY_NAME,
          custom_groupings: {},
        },
        user_type: "HUMAN",
      }),
    })

    if (!response.ok) {
      console.error("Failed to create Merge registered user:", response.statusText)
      return null
    }

    const data = await response.json()
    return data.id || null
  } catch (error) {
    console.error("Error creating Merge registered user:", error)
    return null
  }
}

export async function createMergeLinkToken(mergeUserId: string, integration: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://ah-api.merge.dev/api/v1/registered-users/${mergeUserId}/link-token`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connector: integration,
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
