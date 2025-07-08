import { Elysia } from "elysia"
import { swagger } from "@elysiajs/swagger"
import { api } from "./api/index"
import {
  ResumeParseResponseSchema,
  ResumeParseErrorResponseSchema,
} from "./openapi/schema"
import type { OpenAPIV3 } from "openapi-types"

new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "Resume Skill Extractor API",
          version: "1.0.0",
          description:
            "API for extracting structured candidate data from resume files (PDF only).",
        },
        tags: [{ name: "Resume", description: "Resume parsing endpoints" }],
        components: {
          schemas: {
            ResumeParseResponse:
              ResumeParseResponseSchema as OpenAPIV3.SchemaObject,
            ResumeParseErrorResponse:
              ResumeParseErrorResponseSchema as OpenAPIV3.SchemaObject,
          },
        },
      },
    })
  )
  .use(api)
  .listen(3000)

console.log("Resume Skill Extractor API running at http://localhost:3000")
