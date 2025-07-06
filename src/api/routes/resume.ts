import { Elysia } from "elysia"
import { resumeParserService } from "../../services/resumeParser.service"

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

    // Read the file buffer and filename
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const filename = file.name

    // Call the resume parser service
    const result = await resumeParserService.parseResume(fileBuffer, filename)

    // Set status code based on result
    if (result.success) {
      set.status = 200
    } else {
      set.status = 501 // Not implemented or other error
    }

    // Return the result (success or error)
    return result
  }
)
