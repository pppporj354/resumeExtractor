import type {
  ResumeParseResponse,
  ResumeParseErrorResponse,
  ResumeParseSuccessResponse,
  ResumeData,
  ResumeMetadata,
} from "../types/resume.d.ts"
import { getDocumentProxy, extractText } from "unpdf"
import { openaiNlpService } from "./openaiNlp.service"
import { Logger } from "../utils/logger"

export class ResumeParserService {
  private static readonly MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
  private static readonly API_VERSION = "1.0.0"

  async parseResume(
    fileBuffer: Buffer,
    filename: string
  ): Promise<ResumeParseResponse> {
    const startTime = Date.now()
    Logger.info(`Received resume parse request for file: ${filename}`)

    // Helper to build metadata for all responses
    const buildMetadata = (
      extra: Partial<ResumeMetadata> = {}
    ): ResumeMetadata => ({
      parsed_at: new Date().toISOString(),
      file_info: {
        original_filename: filename,
        file_size_bytes: fileBuffer?.length ?? 0,
        file_type: filename?.toLowerCase().endsWith(".pdf")
          ? "application/pdf"
          : "unknown",
        pages_count: extra.file_info?.pages_count ?? undefined,
      },
      processing_time_ms: Date.now() - startTime,
      api_version: ResumeParserService.API_VERSION,
      warnings: extra.warnings ?? [],
      ...extra,
    })

    // Validate input
    if (!fileBuffer || !filename) {
      Logger.warn("Invalid input: missing file buffer or filename")
      return {
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
        metadata: buildMetadata(),
      }
    }

    // File size validation
    if (fileBuffer.length > ResumeParserService.MAX_FILE_SIZE_BYTES) {
      Logger.warn(`File too large: ${filename} (${fileBuffer.length} bytes)`)
      return {
        success: false,
        error: {
          code: "FILE_TOO_LARGE",
          message: `The uploaded file exceeds the maximum allowed size of ${ResumeParserService.MAX_FILE_SIZE_BYTES} bytes (5MB).`,
          details: `Uploaded file size: ${fileBuffer.length} bytes.`,
          suggestions: [
            "Upload a smaller PDF file (max 5MB).",
            "Reduce the file size before uploading.",
          ],
        },
        metadata: buildMetadata(),
      }
    }

    // Detect file type by extension
    const lowerFilename = filename.toLowerCase()
    let fileType: "pdf" | "unsupported" = "unsupported"
    if (lowerFilename.endsWith(".pdf")) {
      fileType = "pdf"
    }

    // Only support PDF for now
    if (fileType === "unsupported") {
      Logger.warn(`Unsupported file type: ${filename}`)
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
        metadata: buildMetadata(),
      }
    }

    let extractedText = ""
    let pagesCount = 1
    try {
      if (fileType === "pdf") {
        Logger.info(`Extracting text from PDF: ${filename}`)
        const pdf = await getDocumentProxy(new Uint8Array(fileBuffer))
        const { totalPages, text } = await extractText(pdf, {
          mergePages: true,
        })
        extractedText = text
        pagesCount = totalPages
      }
    } catch (err) {
      Logger.error(
        `PDF parsing failed for file: ${filename}`,
        (err as Error).message
      )
      return {
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
        metadata: buildMetadata({
          file_info: {
            pages_count: pagesCount,
            original_filename: "",
            file_size_bytes: 0,
            file_type: "",
          },
          warnings: ["PDF parsing failed"],
        }),
      }
    }

    if (!extractedText || extractedText.trim().length === 0) {
      Logger.warn(`No text extracted from PDF: ${filename}`)
      return {
        success: false,
        error: {
          code: "PARSING_FAILED",
          message: "Unable to extract text from the provided resume file",
          details: "The file appears to be empty or not readable as text.",
          suggestions: [
            "Ensure the file is a text-based PDF.",
            "Try converting image-based PDFs using OCR first.",
          ],
        },
        metadata: buildMetadata({
          file_info: {
            pages_count: pagesCount,
            original_filename: "",
            file_size_bytes: 0,
            file_type: "",
          },
          warnings: ["No text extracted from PDF"],
        }),
      }
    }

    let structuredData: ResumeData | null = null
    let openaiError: string | null = null
    try {
      Logger.info(`Sending extracted text to OpenAI for NLP: ${filename}`)
      structuredData = await openaiNlpService.extractStructuredData(
        extractedText
      )
    } catch (err) {
      openaiError = (err as Error).message
      Logger.error(
        `OpenAI NLP extraction failed for file: ${filename}`,
        openaiError
      )
    }

    if (!structuredData) {
      return {
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
        metadata: buildMetadata({
          file_info: {
            pages_count: pagesCount,
            original_filename: "",
            file_size_bytes: 0,
            file_type: "",
          },
          warnings: ["OpenAI NLP extraction failed."],
        }),
      }
    }

    Logger.info(
      `Resume parsing successful for file: ${filename} in ${
        Date.now() - startTime
      }ms`
    )

    // Build metadata for success
    const metadata: ResumeMetadata = buildMetadata({
      file_info: {
        pages_count: pagesCount,
        original_filename: "",
        file_size_bytes: 0,
        file_type: "",
      },
      warnings: [],
    })

    return {
      success: true,
      data: structuredData,
      metadata,
    }
  }
}

export const resumeParserService = new ResumeParserService()
