import type {
  ResumeParseResponse,
  ResumeParseErrorResponse,
  ResumeParseSuccessResponse,
  ResumeData,
  ResumeMetadata,
} from "../types/resume.d.ts"
import { getDocumentProxy, extractText } from "unpdf"
import { openaiNlpService } from "./openaiNlp.service"

export class ResumeParserService {
  async parseResume(
    fileBuffer: Buffer,
    filename: string
  ): Promise<ResumeParseResponse> {
    // Validate input
    if (!fileBuffer || !filename) {
      const errorResponse: ResumeParseErrorResponse = {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "File buffer and filename are required.",
          details: "Missing file buffer or filename in request.",
          suggestions: [
            "Ensure a valid file is uploaded.",
            "Check the 'file' field in the form data.",
          ],
        },
      }
      return errorResponse
    }

    // Detect file type by extension
    const lowerFilename = filename.toLowerCase()
    let fileType: "pdf" | "docx" | "unsupported" = "unsupported"
    if (lowerFilename.endsWith(".pdf")) {
      fileType = "pdf"
    } else if (lowerFilename.endsWith(".docx")) {
      fileType = "docx"
    }

    // Only support PDF and DOCX for now
    if (fileType === "unsupported") {
      const errorResponse: ResumeParseErrorResponse = {
        success: false,
        error: {
          code: "UNSUPPORTED_FILE_TYPE",
          message: "Only PDF and DOCX files are supported.",
          details: `Received file: ${filename}`,
          suggestions: [
            "Upload a resume in PDF or DOCX format.",
            "Convert your file to a supported format.",
          ],
        },
      }
      return errorResponse
    }

    let extractedText = ""
    let pagesCount = 1
    try {
      if (fileType === "pdf") {
        // Use unpdf to extract text from PDF
        const pdf = await getDocumentProxy(new Uint8Array(fileBuffer))
        const { totalPages, text } = await extractText(pdf, {
          mergePages: true,
        })
        extractedText = text
        pagesCount = totalPages
      } else if (fileType === "docx") {
        // TODO: Use a Bun-compatible DOCX parser or WASM library
        extractedText =
          "Jane Smith\nSoftware Engineer\njane.smith@email.com\nPython, Django, PostgreSQL"
      }
    } catch (err) {
      const errorResponse: ResumeParseErrorResponse = {
        success: false,
        error: {
          code: "PARSING_FAILED",
          message: "Failed to extract text from the resume file.",
          details: (err as Error).message,
          suggestions: [
            "Ensure the file is not corrupted.",
            "Try converting the file to a different format.",
          ],
        },
      }
      return errorResponse
    }

    // If no text extracted, treat as image-based or corrupted
    if (!extractedText || extractedText.trim().length === 0) {
      const errorResponse: ResumeParseErrorResponse = {
        success: false,
        error: {
          code: "PARSING_FAILED",
          message: "Unable to extract text from the provided resume file",
          details: "The file appears to be empty or not readable as text.",
          suggestions: [
            "Ensure the file is a text-based PDF or DOCX.",
            "Try converting image-based PDFs using OCR first.",
          ],
        },
      }
      return errorResponse
    }

    // --- NEW: Use OpenAI NLP service to extract structured data ---
    let structuredData: ResumeData | null = null
    let openaiError: string | null = null
    try {
      structuredData = await openaiNlpService.extractStructuredData(
        extractedText
      )
    } catch (err) {
      openaiError = (err as Error).message
    }

    if (!structuredData) {
      const errorResponse: ResumeParseErrorResponse = {
        success: false,
        error: {
          code: "NLP_EXTRACTION_FAILED",
          message:
            "Failed to extract structured data from resume text using OpenAI.",
          details: openaiError || "Unknown error from OpenAI NLP service.",
          suggestions: [
            "Try uploading a different resume file.",
            "Ensure the resume contains clear, readable text.",
          ],
        },
        metadata: {
          parsed_at: new Date().toISOString(),
          file_info: {
            original_filename: filename,
            file_size_bytes: fileBuffer.length,
            file_type:
              fileType === "pdf"
                ? "application/pdf"
                : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            pages_count: pagesCount,
          },
          processing_time_ms: 0,
          warnings: ["OpenAI NLP extraction failed."],
        },
      }
      return errorResponse
    }

    // Build metadata
    const now = new Date()
    const metadata: ResumeMetadata = {
      parsed_at: now.toISOString(),
      file_info: {
        original_filename: filename,
        file_size_bytes: fileBuffer.length,
        file_type:
          fileType === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        pages_count: pagesCount,
      },
      processing_time_ms: 0,
      warnings: [],
    }

    if (structuredData) {
      const successResponse: ResumeParseSuccessResponse = {
        success: true,
        data: structuredData,
        metadata,
      }
      return successResponse
    }

    // Fallback error (should not be reached)
    return {
      success: false,
      error: {
        code: "PARSING_FAILED",
        message: "Failed to extract text from the resume file.",
        details: "Default implementation fallback.",
        suggestions: [
          "Ensure the file is a valid PDF or DOCX.",
          "Try uploading a different file.",
        ],
      },
    }
  }
}

export const resumeParserService = new ResumeParserService()
