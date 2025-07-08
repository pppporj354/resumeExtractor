import { Elysia } from "elysia"

export const healthRoute = new Elysia().get(
  "/health",
  () => ({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }),
  {
    detail: {
      tags: ["Health"],
      summary: "Health check endpoint",
      description: "Returns API status and uptime for monitoring.",
      responses: {
        200: {
          description: "API is healthy",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "ok" },
                  uptime: { type: "number", example: 123.45 },
                  timestamp: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
      },
    },
  }
)
