import { describe, it, expect, beforeAll, afterAll, spyOn } from "bun:test"
import { OpenAINlpService } from "../src/services/openaiNlp.service"

describe("OpenAINlpService", () => {
  const originalFetch = globalThis.fetch
  const apiKey = "test-api-key"
  let service: OpenAINlpService

  beforeAll(() => {
    process.env.OPENAI_API_KEY = apiKey
    service = new OpenAINlpService()
  })

  afterAll(() => {
    globalThis.fetch = originalFetch
    delete process.env.OPENAI_API_KEY
  })

  it("should return structured data when OpenAI returns valid JSON", async () => {
    const mockJson = {
      personal_info: { full_name: "John Doe" },
      professional_summary: {},
      skills: {},
      work_experience: [],
      education: [],
      projects: [],
      languages: [],
    }
    spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify(mockJson),
            },
          },
        ],
      }),
    } as any)

    const result = await service.extractStructuredData("resume text here")
    expect(result).toHaveProperty("personal_info")
    expect(result.personal_info.full_name).toBe("John Doe")
  })

  it("should throw if OpenAI returns invalid JSON", async () => {
    spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: "{ invalid json",
            },
          },
        ],
      }),
    } as any)

    await expect(
      service.extractStructuredData("resume text here")
    ).rejects.toThrow(/Failed to parse JSON/)
  })

  it("should throw if OpenAI returns an error response", async () => {
    spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () => "Unauthorized",
    } as any)

    await expect(
      service.extractStructuredData("resume text here")
    ).rejects.toThrow(/OpenAI API error: 401 Unauthorized/)
  })

  it("should throw if OpenAI returns unexpected format", async () => {
    spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as any)

    await expect(
      service.extractStructuredData("resume text here")
    ).rejects.toThrow(/unexpected response format/)
  })
})
