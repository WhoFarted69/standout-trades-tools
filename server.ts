/**
 * standout-trades-tools — MCP server (Streamable HTTP, stateless, no auth).
 * Exposes one read-only tool: calculate_job_profit.
 */
import { createServer } from "node:http"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { z } from "zod"
import { calculate_job_profit } from "./calculate_job_profit.ts"

const PORT = Number(process.env.PORT) || 3000

function buildServer(): McpServer {
    const server = new McpServer({ name: "standout-trades-tools", version: "0.1.0" })

    server.registerTool(
        "calculate_job_profit",
        {
            title: "Calculate Job Profit",
            description:
                "Calculates estimated job profit for contractors and home-service businesses. " +
                "Given truck and equipment daily costs, days on the job, travel distance, fuel economy, " +
                "fuel price, equipment fuel tanks, other costs and the price charged, it returns truck miles " +
                "and gallons, fuel expenses, total cost, profit, profit percentage (return on cost), " +
                "margin percentage (on price), and the break-even price. " +
                "Pure calculation: it does not access the internet or store any data. " +
                "Blank, negative or invalid numbers are treated as 0. All money is in USD.",
            inputSchema: {
                vehicleCost: z.number().optional().describe("Truck/vehicle cost per day, in dollars."),
                equipmentCost: z.number().optional().describe("Equipment cost per day, in dollars (rented or owned)."),
                days: z.number().optional().describe("Number of days on the job."),
                mpg: z.number().optional().describe("Truck fuel economy in miles per gallon."),
                distance: z.number().optional().describe("One-way distance to the customer, in miles."),
                roundTrip: z.boolean().optional().describe("True if the truck drives the distance both ways. Defaults to false."),
                fuelPrice: z.number().optional().describe("Fuel price per gallon, in dollars (gas or diesel)."),
                tankSize: z.number().optional().describe("Equipment fuel tank size, in gallons."),
                tanks: z.number().optional().describe("Number of equipment tanks used on the job."),
                otherCosts: z.number().optional().describe("Other job costs in dollars (dump fees, materials, etc.)."),
                jobPrice: z.number().optional().describe("Amount charged to the customer, in dollars."),
            },
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
        },
        async (args) => {
            const result = calculate_job_profit(args)
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                structuredContent: { ...result },
            }
        }
    )

    return server
}

const httpServer = createServer(async (req, res) => {
    const path = (req.url ?? "").split("?")[0]
    if (path !== "/mcp") {
        res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found")
        return
    }
    if (req.method !== "POST") {
        // Stateless server: no GET (SSE) or DELETE (session) support.
        res.writeHead(405, { Allow: "POST", "Content-Type": "application/json" }).end(
            JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null })
        )
        return
    }

    // Stateless: a fresh server + transport per request.
    const server = buildServer()
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
    })
    res.on("close", () => {
        transport.close()
        server.close()
    })
    try {
        await server.connect(transport)
        await transport.handleRequest(req, res)
    } catch (err) {
        console.error(err)
        if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "application/json" }).end(
                JSON.stringify({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null })
            )
        }
    }
})

httpServer.listen(PORT, () => {
    console.log(`standout-trades-tools MCP server listening on http://localhost:${PORT}/mcp`)
})
