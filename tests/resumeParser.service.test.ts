import { describe, it, expect, beforeAll, afterAll, mock } from "bun:test"
import { resumeParserService } from "../src/services/resumeParser.service"
import type {
  ResumeParseSuccessResponse,
  ResumeParseErrorResponse,
} from "../src/types/resume"

describe("ResumeParserService", () => {
  beforeAll(() => {
    process.env.OPENAI_API_KEY = "test-api-key"
  })

  afterAll(() => {
    delete process.env.OPENAI_API_KEY
  })

  it("should return INVALID_INPUT error when buffer is null", async () => {
    const result = await resumeParserService.parseResume(
      null as any,
      "resume.pdf"
    )

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe("INVALID_INPUT")
      expect(result.error.message).toBe(
        "File buffer and filename are required."
      )
    }
  })

  it("should return INVALID_INPUT error when filename is empty", async () => {
    const dummyBuffer = Buffer.from("dummy content")
    const result = await resumeParserService.parseResume(dummyBuffer, "")

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe("INVALID_INPUT")
      expect(result.error.message).toBe(
        "File buffer and filename are required."
      )
    }
  })

  it("should return UNSUPPORTED_FILE_TYPE error for non-PDF files", async () => {
    const dummyBuffer = Buffer.from("dummy content")
    const testCases = ["resume.txt", "resume.docx", "resume.jpg", "resume"]

    for (const filename of testCases) {
      const result = await resumeParserService.parseResume(
        dummyBuffer,
        filename
      )

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.code).toBe("UNSUPPORTED_FILE_TYPE")
        expect(result.error.message).toBe("Only PDF files are supported.")
        expect(result.error.details).toBe(`Received file: ${filename}`)
      }
    }
  })

  it("should return PARSING_FAILED error when PDF extraction fails", async () => {
    // Mock unpdf to throw an error
    mock.module("unpdf", () => {
      return {
        getDocumentProxy: async () => {
          throw new Error("PDF parsing failed")
        },
        extractText: async () => ({
          totalPages: 1,
          text: "dummy text",
        }),
      }
    })

    const dummyBuffer = Buffer.from("dummy PDF content")
    const result = await resumeParserService.parseResume(
      dummyBuffer,
      "resume.pdf"
    )

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe("PARSING_FAILED")
      expect(result.error.message).toBe(
        "Failed to extract text from the resume file."
      )
    }
  })

  it("should return PARSING_FAILED error when extracted text is empty", async () => {
    // Mock unpdf to return empty text
    mock.module("unpdf", () => {
      return {
        getDocumentProxy: async () => ({}),
        extractText: async () => ({
          totalPages: 1,
          text: "",
        }),
      }
    })

    const dummyBuffer = Buffer.from("dummy PDF content")
    const result = await resumeParserService.parseResume(
      dummyBuffer,
      "resume.pdf"
    )

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe("PARSING_FAILED")
      expect(result.error.message).toBe(
        "Unable to extract text from the provided resume file"
      )
    }
  })

  it("should return NLP_EXTRACTION_FAILED when OpenAI service fails", async () => {
    // Mock unpdf to succeed
    mock.module("unpdf", () => {
      return {
        getDocumentProxy: async () => ({}),
        extractText: async () => ({
          totalPages: 1,
          text: "Valid resume text content",
        }),
      }
    })

    // Mock OpenAI service to fail
    mock.module("../src/services/openaiNlp.service", () => {
      return {
        openaiNlpService: {
          extractStructuredData: async () => {
            throw new Error("OpenAI API failed")
          },
        },
      }
    })

    const dummyBuffer = Buffer.from("dummy PDF content")
    const result = await resumeParserService.parseResume(
      dummyBuffer,
      "resume.pdf"
    )

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe("NLP_EXTRACTION_FAILED")
      expect(result.error.message).toBe(
        "Failed to extract structured data from resume text using OpenAI."
      )
    }
  })

  it("should return success response when everything works correctly", async () => {
    // Mock unpdf to succeed
    mock.module("unpdf", () => {
      return {
        getDocumentProxy: async () => ({}),
        extractText: async () => ({
          totalPages: 2,
          text: "John Doe\nSoftware Engineer\njohn@email.com",
        }),
      }
    })

    // Mock OpenAI service to succeed
    mock.module("../src/services/openaiNlp.service", () => {
      return {
        openaiNlpService: {
          extractStructuredData: async () => ({
            personal_info: {
              full_name: "John Doe",
              email: "john@email.com",
            },
            professional_summary: {
              title: "Software Engineer",
            },
            skills: {
              technical_skills: [],
              soft_skills: [],
              certifications: [],
            },
            work_experience: [],
            education: [],
            projects: [],
            languages: [],
          }),
        },
      }
    })

    const dummyBuffer = Buffer.from("dummy PDF content")
    const result = await resumeParserService.parseResume(
      dummyBuffer,
      "resume.pdf"
    )

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBeDefined()
      expect(result.data.personal_info?.full_name).toBe("John Doe")
      expect(result.data.personal_info?.email).toBe("john@email.com")
      expect(result.metadata).toBeDefined()
      expect(result.metadata.file_info.pages_count).toBe(2)
      expect(result.metadata.file_info.file_type).toBe("")
    }
  })
})
