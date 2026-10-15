import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

export interface AuthTokenPayload {
  userId: string;
  roleId: string;
  roleName: string;

}

export const generateToken = (
  payload: AuthTokenPayload
): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const verifyToken = (
  token: string
): AuthTokenPayload => {
  return jwt.verify(
    token,
    JWT_SECRET
  ) as AuthTokenPayload;
};