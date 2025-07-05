import { Elysia } from "elysia"
import { api } from "./api/index"

const app = new Elysia()

app.use(api)
app.listen(3000)
console.log("Resume Skill Extractor API running at http://localhost:3000")
