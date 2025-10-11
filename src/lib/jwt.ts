import jwt from 'jsonwebtoken'

export function signParagonToken(userId: string): string {
  // Get the RSA private key from environment variable
  // The key should be in PEM format
  const privateKey = process.env.PARAGON_SIGNING_KEY!
  const currentTime = Math.floor(Date.now() / 1000)

  const payload = {
    sub: `${userId}/Meta`,
    aud: `useparagon.com/${process.env.PARAGON_PROJECT_ID}`,
    iat: currentTime,
    exp: currentTime + 3600 // 1 hour from now
  }

  // Replace \n literals with actual newlines for PEM format
  const formattedKey = privateKey.replace(/\\n/g, '\n')

  return jwt.sign(payload, formattedKey, {
    algorithm: "RS256",
  })
}

export function signIntegrationAppToken(userId: string, userName: string): string {
  const workspaceKey = process.env.INTEGRATION_APP_WORKSPACE_KEY!
  const workspaceSecret = process.env.INTEGRATION_APP_WORKSPACE_SECRET!

  const tokenData = {
    workspaceKey: workspaceKey,
    id: userId,
    name: userName,
    fields: {},
  }

  const options = {
    expiresIn: 7200, // 2 hours
    algorithm: "HS512" as const,
  }

  return jwt.sign(tokenData, workspaceSecret, options)
}
