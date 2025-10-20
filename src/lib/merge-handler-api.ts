const DEFAULT_COMPANY_ID = "2c9b228f-da0f-46fd-9c7b-f97031ce0985-default"
const DEFAULT_COMPANY_NAME = "Meta default"

const apiKey = process.env.MERGE_HANDLER_API_KEY

async function makeMergeHandlerRequest(
  url: string,
  options?: RequestInit
): Promise<any> {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
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

export async function mergeGetRegisteredUserId(userId: string): Promise<string | null> {
  try {
    const data = await makeMergeHandlerRequest(
      "https://ah-api.merge.dev/api/v1/registered-users",
      {
        method: "GET",
      }
    )

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

export async function mergeCreateRegisteredUser(
  userId: string,
  userEmail: string
): Promise<string | null> {
  try {
    const data = await makeMergeHandlerRequest(
      "https://ah-api.merge.dev/api/v1/registered-users",
      {
        method: "POST",
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
      }
    )

    return data.id || null
  } catch (error) {
    console.error("Error creating Merge registered user:", error)
    return null
  }
}

export async function mergeCreateLinkToken(mergeUserId: string, integration: string): Promise<string | null> {
  try {
    const data = await makeMergeHandlerRequest(
      `https://ah-api.merge.dev/api/v1/registered-users/${mergeUserId}/link-token`,
      {
        method: "POST",
        body: JSON.stringify({
          connector: integration,
        }),
      }
    )

    return data.link_token || null
  } catch (error) {
    console.error("Error creating Merge link token:", error)
    return null
  }
}
