import { Elysia } from "elysia"
import { resumeParserService } from "../../services/resumeParser.service"
import { ResumeParseResponseSchema } from "../../openapi/schema"

export const resumeRoute = new Elysia().post(
  "/v1/parse/resume",
  async ({ body, set }) => {
    // Only check if body is FormData
    if (!(body instanceof FormData)) {
      set.status = 400
      return {
        success: false,
        error: {
          code: "INVALID_REQUEST",
          message:
            "Request body must be multipart/form-data with a file field named 'file'.",
          details: "No FormData found in request body.",
          suggestions: [
            "Send the resume file as multipart/form-data.",
            "Include a field named 'file' containing the resume file.",
          ],
        },
      }
    }

    // Extract the file from the FormData
    const file = body.get("file")
    if (!file || !(file instanceof File)) {
      set.status = 400
      return {
        success: false,
        error: {
          code: "FILE_MISSING",
          message:
            "No file uploaded. Please include a file field named 'file'.",
          details: "The 'file' field is required in the multipart/form-data.",
          suggestions: ["Attach a resume file using the 'file' field."],
        },
      }
    }

    const filename = file.name
    const lowerFilename = filename.toLowerCase()
    // Only support PDF for now
    if (!lowerFilename.endsWith(".pdf")) {
      set.status = 400
      return {
        success: false,
        error: {
          code: "UNSUPPORTED_FILE_TYPE",
          message: "Only PDF files are supported.",
          details: `Received file: ${filename}`,
          suggestions: [
            "Upload a resume in PDF format.",
            "Convert your file to a supported format.",
          ],
        },
      }
    }

    // Read the file buffer and filename
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Call the resume parser service
    const result = await resumeParserService.parseResume(fileBuffer, filename)

    // Set status code based on result
    if (result.success) {
      set.status = 200
      return result
    } else {
      // Explicitly check for unsupported file type
      if (result.error.code === "UNSUPPORTED_FILE_TYPE") {
        set.status = 400
        return result
      }
      set.status = 501 // Not implemented or other error
      return result
    }
  },
  {
    detail: {
      tags: ["Resume"],
      summary: "Parse a resume file and extract structured candidate data",
      description:
        "Accepts a PDF resume file (multipart/form-data) and returns structured JSON with skills, contact info, and experience.",
      responses: {
        200: {
          description: "Successful extraction",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResumeParseResponse" },
            },
          },
        },
        400: {
          description: "Invalid request or unsupported file type",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResumeParseErrorResponse" },
            },
          },
        },
        500: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResumeParseErrorResponse" },
            },
          },
        },
      },
    },
  }
)
