import { Elysia } from "elysia"
import { resumeRoute } from "./routes/resume"

export const api = new Elysia().use(resumeRoute)
