import { describe, it, expect } from "bun:test"
import { resumeParserService } from "../src/services/resumeParser.service"
import type { ResumeParseSuccessResponse } from "../src/types/resume"

describe("resumeParserService", () => {
  it("should return success response for any input(current implementation)", async () => {
    const dummyBuffer = Buffer.from("dummy resume content")
    const dummyFilename = "resume.pdf"

    // Act: call the parseResume method
    const result = await resumeParserService.parseResume(
      dummyBuffer,
      dummyFilename
    )

    // Assert: check that the result is a success response
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBeDefined()
    }
  })
  it("should eventually extract structured data from a valid file(future implementation)", async () => {
    const sampleBuffer = Buffer.from("sample resume content")
    const sampleFilename = "sample_resume.pdf"

    const result = await resumeParserService.parseResume(
      sampleBuffer,
      sampleFilename
    )

    if (result.success) {
      const data = (result as unknown as ResumeParseSuccessResponse).data
      expect(data).toHaveProperty("personal_info")
      expect(data).toHaveProperty("skills")
      expect(data).toHaveProperty("work_experience")
    } else {
      expect(result.error.code).toBe("PARSING_FAILED")
    }
  })
})
