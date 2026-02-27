import { jwtVerify, SignJWT } from 'jose'

const encoder = new TextEncoder()
const ACCESS_SECRET = encoder.encode(process.env.JWT_ACCESS_SECRET)
const REFRESH_SECRET = encoder.encode(process.env.JWT_REFRESH_SECRET)

export const ACCESS_TOKEN_EXPIRY = '15m'
export const REFRESH_TOKEN_EXPIRY = '7d'
export const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

export const signAccessToken = (userId: string) => {
    return new SignJWT({ sub: userId, type: 'access' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(ACCESS_TOKEN_EXPIRY)
        .sign(ACCESS_SECRET)
}

export const signRefreshToken = (userId: string, tokenId: string) => {
    return new SignJWT({ sub: userId, jti: tokenId, type: 'refresh' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(REFRESH_TOKEN_EXPIRY)
        .sign(REFRESH_SECRET)
}

export const verifyAccessToken = (token: string) => {
    return jwtVerify(token, ACCESS_SECRET)
}

export const verifyRefreshToken = (token: string) => {
    return jwtVerify(token, REFRESH_SECRET)
}
