import type { VercelRequest, VercelResponse } from "@vercel/node";
import expressApp from "../src/app";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return expressApp(req, res);
}
