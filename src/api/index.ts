import { Elysia } from "elysia"
import { resumeRoute } from "./routes/resume"
import { healthRoute } from "./routes/health"

export const api = new Elysia().use(resumeRoute).use(healthRoute)
