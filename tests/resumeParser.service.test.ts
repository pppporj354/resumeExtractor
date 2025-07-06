import { describe, it, expect } from "bun:test"
import { resumeParserService } from "../src/services/resumeParser.service"
import type { ResumeParseSuccessResponse } from "../src/types/resume"

describe("resumeParserService", () => {
  it("should return NOT_IMPLEMENTED error for any input(default implementation)", async () => {
    const dummyBuffer = Buffer.from("dummy resume content")
    const dummyFilename = "resume.pdf"

    // Act: call the parseResume method
    const result = await resumeParserService.parseResume(
      dummyBuffer,
      dummyFilename
    )

    // Assert: check that the result is an error response with NOT_IMPLEMENTED code
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe("NOT_IMPLEMENTED")
      expect(result.error.message).toBe(
        "Resume parsing is not implemented yet."
      )
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
      // Current implementation: still not implemented
      expect(result.error.code).toBe("NOT_IMPLEMENTED")
    }
  })
})
