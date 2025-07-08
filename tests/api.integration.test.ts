import { describe, it, expect, mock } from "bun:test"
import { Elysia } from "elysia"
import { resumeRoute } from "../src/api/routes/resume"
import { healthRoute } from "../src/api/routes/health"

// Helper to create the test server
function createTestServer() {
  const app = new Elysia().use(resumeRoute)
  return app
}

// Helper to create a test server with only the health route
function createHealthTestServer() {
  const app = new Elysia().use(healthRoute)
  return app
}

describe("POST /v1/parse/resume (integration)", () => {
  it("should return 400 if no file is provided", async () => {
    const app = createTestServer()
    const response = await app.handle(
      new Request("http://localhost/v1/parse/resume", {
        method: "POST",
        headers: {
          "Content-Type":
            "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW",
        },
        body: "", // No file in body
      })
    )
    expect(response.status).toBe(400)
    let json: any
    try {
      json = await response.json()
    } catch (e) {
      json = {}
    }
    expect(json.success === false || json.success === undefined).toBe(true)
  })

  it("should return 400 if file field is missing", async () => {
    const app = createTestServer()
    // FormData with no 'file' field
    const formData = new FormData()
    formData.append("not_a_file", new File(["dummy"], "dummy.txt"))
    const response = await app.handle(
      new Request("http://localhost/v1/parse/resume", {
        method: "POST",
        body: formData,
      })
    )
    expect(response.status).toBe(400)
    let json: any
    try {
      json = await response.json()
    } catch (e) {
      json = {}
    }
    expect(json.success).toBe(false)
    expect(
      json.error &&
        (json.error.code === "INVALID_REQUEST" ||
          json.error.code === "FILE_MISSING")
    ).toBe(true)
  })

  it("should return 400 for unsupported file type", async () => {
    const app = createTestServer()
    const file = new File(["dummy"], "resume.txt", { type: "text/plain" })
    const formData = new FormData()
    formData.append("file", file)
    const response = await app.handle(
      new Request("http://localhost/v1/parse/resume", {
        method: "POST",
        body: formData,
      })
    )
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.success).toBe(false)
    expect(json.error.code).toBe("UNSUPPORTED_FILE_TYPE")
  })

  it("should return 200 and structured data for valid PDF file (mocked OpenAI and PDF extraction)", async () => {
    // Mock unpdf and OpenAI NLP service before importing the route
    mock.module("../src/services/openaiNlp.service.ts", () => {
      return {
        openaiNlpService: {
          extractStructuredData: async () => ({
            personal_info: {
              full_name: "Mocked Name",
              email: "mock@email.com",
            },
            professional_summary: {},
            skills: {},
            work_experience: [],
            education: [],
            projects: [],
            languages: [],
          }),
        },
      }
    })
    mock.module("unpdf", () => {
      return {
        getDocumentProxy: async () => ({}),
        extractText: async () => ({
          totalPages: 1,
          text: "Mocked resume text",
        }),
      }
    })

    // Re-import the route to use the mocked modules
    const { resumeRoute: mockedRoute } = await import(
      "../src/api/routes/resume"
    )
    const app = new Elysia().use(mockedRoute)

    const file = new File(["dummy"], "resume.pdf", { type: "application/pdf" })
    const formData = new FormData()
    formData.append("file", file)

    const response = await app.handle(
      new Request("http://localhost/v1/parse/resume", {
        method: "POST",
        body: formData,
      })
    )
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.data).toBeDefined()
    expect(json.data.personal_info.full_name).toBe("Mocked Name")
    expect(json.data.personal_info.email).toBe("mock@email.com")
  })

  it("should return 400 if file is larger than 5MB", async () => {
    const app = createTestServer()
    // Create a buffer larger than 5MB
    const largeBuffer = new Uint8Array(5 * 1024 * 1024 + 1).fill(1)
    const file = new File([largeBuffer], "large_resume.pdf", {
      type: "application/pdf",
    })
    const formData = new FormData()
    formData.append("file", file)

    const response = await app.handle(
      new Request("http://localhost/v1/parse/resume", {
        method: "POST",
        body: formData,
      })
    )
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.success).toBe(false)
    expect(json.error.code).toBe("INVALID_REQUEST")
    expect(json.error.message).toBe(
      "Request body must be multipart/form-data with a file field named 'file'."
    )
  })
})

describe("GET /health (integration)", () => {
  it("should return 200 and status ok with uptime and timestamp", async () => {
    const app = createHealthTestServer()
    const response = await app.handle(
      new Request("http://localhost/health", {
        method: "GET",
      })
    )
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json).toHaveProperty("status", "ok")
    expect(typeof json.uptime).toBe("number")
    expect(typeof json.timestamp).toBe("string")
    // Optionally, check that timestamp is a valid ISO string
    expect(() => new Date(json.timestamp)).not.toThrow()
  })
})
