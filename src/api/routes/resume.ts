import { Elysia } from "elysia"

export const resumeRoute = new Elysia().post(
  "/v1/parse/resume",
  async ({ body, set }) => {
    set.status = 501 // Not implemented
    return { success: false, error: "Not implemented" }
  }
)
