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

  it("should throw error when OPENAI_API_KEY is not set", () => {
    delete process.env.OPENAI_API_KEY

    expect(() => new OpenAINlpService()).toThrow(
      "OPENAI_API_KEY is not set in environment variables."
    )

    // Restore for other tests
    process.env.OPENAI_API_KEY = apiKey
  })

  it("should return structured data when OpenAI returns valid JSON", async () => {
    const mockJson = {
      personal_info: { full_name: "John Doe", email: "john@email.com" },
      professional_summary: { title: "Software Engineer" },
      skills: { technical_skills: [], soft_skills: [], certifications: [] },
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

    const result = await service.extractStructuredData(
      "John Doe\nSoftware Engineer\njohn@email.com"
    )

    expect(result).toHaveProperty("personal_info")
    expect(result.personal_info.full_name).toBe("John Doe")
    expect(result.personal_info.email).toBe("john@email.com")
    expect(result).toHaveProperty("professional_summary")
    expect(result).toHaveProperty("skills")
    expect(result).toHaveProperty("work_experience")
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
    ).rejects.toThrow(/Failed to parse JSON from OpenAI response/)
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

  it("should throw if OpenAI returns unexpected response format", async () => {
    spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as any)

    await expect(
      service.extractStructuredData("resume text here")
    ).rejects.toThrow(/unexpected response format/)
  })

  it("should throw if OpenAI returns missing message content", async () => {
    spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {},
          },
        ],
      }),
    } as any)

    await expect(
      service.extractStructuredData("resume text here")
    ).rejects.toThrow(/unexpected response format/)
  })

  it("should throw if fetch fails with network error", async () => {
    spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"))

    await expect(
      service.extractStructuredData("resume text here")
    ).rejects.toThrow(/OpenAI NLP extraction failed: Network error/)
  })
})
