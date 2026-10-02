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

// TEMPORARY: "*" for testing with MCP Inspector. Restrict before production.
const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
        "Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id, Last-Event-ID, Authorization",
    "Access-Control-Expose-Headers": "Mcp-Session-Id",
}

function buildServer(): McpServer {
    const server = new McpServer({ name: "standout-trades-tools", version: "0.1.0" })

    server.registerTool(
        "calculate_job_profit",
        {
            title: "Calculate Job Profit",
            description:
                "Calculates estimated job profitability for contractors and home-service businesses. " +
                "Using vehicle and equipment daily costs, days on the job, travel distance and truck fuel economy, " +
                "fuel price, equipment fuel tank usage, other job costs, and the price charged to the customer, " +
                "it returns truck miles and gallons, fuel expenses, total cost, profit, profit percentage (return on cost), " +
                "margin percentage (on price), and the break-even price. " +
                "All inputs are required; provide 0 for any cost that does not apply. " +
                "Pure calculation: it does not access the internet or store any data. All money is in USD.",
            inputSchema: {
                vehicleCost: z.number().describe("Truck/vehicle cost per day, in dollars."),
                equipmentCost: z.number().describe("Equipment cost per day, in dollars (rented or owned)."),
                days: z.number().describe("Number of days on the job."),
                mpg: z.number().describe("Truck fuel economy in miles per gallon."),
                distance: z.number().describe("One-way distance to the customer, in miles."),
                roundTrip: z.boolean().describe("True if the truck drives the distance both ways, false for one way only."),
                fuelPrice: z.number().describe("Fuel price per gallon, in dollars (gas or diesel)."),
                tankSize: z.number().describe("Equipment fuel tank size, in gallons."),
                tanks: z.number().describe("Number of equipment tanks used on the job."),
                otherCosts: z.number().describe("Other job costs in dollars (dump fees, materials, etc.)."),
                jobPrice: z.number().describe("Amount charged to the customer, in dollars."),
            },
            outputSchema: {
                truckMiles: z.number().describe("Total truck miles driven (doubled for round trips)."),
                truckGallons: z.number().describe("Gallons of fuel used by the truck."),
                truckFuelCost: z.number().describe("Truck fuel cost, in dollars."),
                equipmentGallons: z.number().describe("Gallons of fuel used by equipment (tank size times tanks)."),
                equipmentFuelCost: z.number().describe("Equipment fuel cost, in dollars."),
                equipmentCost: z.number().describe("Vehicle plus equipment cost over all days, in dollars."),
                totalCost: z.number().describe("Total job cost, in dollars."),
                profit: z.number().describe("Job price minus total cost, in dollars (negative is a loss)."),
                profitPct: z.number().describe("Profit as a percentage of total cost (return on cost)."),
                marginPct: z.number().describe("Profit as a percentage of the job price (margin)."),
                breakEvenPrice: z.number().describe("Lowest job price that covers total cost, in dollars."),
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
    for (const [name, value] of Object.entries(CORS_HEADERS)) res.setHeader(name, value)
    if (req.method === "OPTIONS") {
        res.writeHead(204).end()
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
