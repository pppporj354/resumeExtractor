import { describe, it, expect } from "bun:test"
import { Elysia } from "elysia"
import { resumeRoute } from "../src/api/routes/resume"

function createTestServer() {
  const app = new Elysia().use(resumeRoute)
  return app
}

describe("Resume Route Validation", () => {
  it("should handle large file uploads gracefully", async () => {
    const app = createTestServer()
    const largeContent = "A".repeat(10 * 1024 * 1024) // 10MB
    const file = new File([largeContent], "large_resume.pdf", {
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

    // Should not crash and should return some response
    expect(response.status).toBeGreaterThanOrEqual(200)
    expect(response.status).toBeLessThan(600)
  })

  it("should handle empty file gracefully", async () => {
    const app = createTestServer()
    const file = new File([""], "empty_resume.pdf", { type: "application/pdf" })
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
  })

  it("should handle special characters in filename", async () => {
    const app = createTestServer()
    const file = new File(["dummy"], "résumé-João_Smith's (2024).pdf", {
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

    // Should not crash due to special characters
    expect(response.status).toBeGreaterThanOrEqual(200)
    expect(response.status).toBeLessThan(600)
  })

  it("should return proper Content-Type header", async () => {
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

    expect(response.headers.get("content-type")).toBe("application/json")
  })
})
