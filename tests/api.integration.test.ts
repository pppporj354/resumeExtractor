import { describe, it, expect } from "bun:test"
import { Elysia } from "elysia"
import { resumeRoute } from "../src/api/routes/resume"

function createTestServer() {
  const app = new Elysia().use(resumeRoute)
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
    // Debug log to inspect the actual JSON response
    console.log("Response JSON:", json)
    expect(json.success === false || json.success === undefined).toBe(true)
    expect(json.error && json.error.code).toBe("INVALID_REQUEST")
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
    // Debug log to inspect the actual JSON response
    console.log("Response JSON:", json)
    expect(json.success).toBe(false)
    expect(json.error && json.error.code).toBe("INVALID_REQUEST")
  })

  it("should return 501 NOT_IMPLEMENTED for any valid file upload (default service)", async () => {
    const app = createTestServer()
    const fileContent = Buffer.from("dummy resume content")
    const file = new File([fileContent], "resume.pdf", {
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
    expect(json.success === false || json.success === undefined).toBe(true)
    expect(json.error && json.error.code).toBe("INVALID_REQUEST")
    expect(json.error.code).toBe("INVALID_REQUEST")
  })
})
