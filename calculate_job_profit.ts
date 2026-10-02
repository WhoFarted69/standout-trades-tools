/**
 * calculate_job_profit
 *
 * Pure calculation logic extracted from EquipmentJobProfitCalculator.
 * No UI, no DOM, no network. Formulas and input cleaning match the original exactly.
 */

export interface JobProfitInput {
    vehicleCost?: number | string | null // truck/vehicle cost per day ($)
    equipmentCost?: number | string | null // equipment cost per day ($)
    days?: number | string | null // days on the job
    mpg?: number | string | null // truck MPG
    distance?: number | string | null // one-way distance to customer (miles)
    roundTrip?: boolean // true = distance counted twice
    fuelPrice?: number | string | null // $ per gallon
    tankSize?: number | string | null // equipment fuel tank (gallons)
    tanks?: number | string | null // equipment tanks used
    otherCosts?: number | string | null // other job costs ($)
    jobPrice?: number | string | null // amount charged to customer ($)
}

export interface JobProfitResult {
    truckMiles: number
    truckGallons: number
    truckFuelCost: number
    equipmentGallons: number
    equipmentFuelCost: number
    equipmentCost: number // (vehicleCost + equipmentCost) * days
    totalCost: number
    profit: number
    profitPct: number // return on cost
    marginPct: number // margin on price
    breakEvenPrice: number
}

// Blank, negative, NaN and Infinity all collapse to 0.
function num(value: unknown): number {
    const n = parseFloat(value as string)
    return Number.isFinite(n) && n > 0 ? n : 0
}

function safe(n: number): number {
    return Number.isFinite(n) ? (Object.is(n, -0) ? 0 : n) : 0
}

export function calculate_job_profit(input: JobProfitInput): JobProfitResult {
    const vehicleCost = num(input.vehicleCost)
    const equipmentCostPerDay = num(input.equipmentCost)
    const days = num(input.days)
    const mpg = num(input.mpg)
    const distance = num(input.distance)
    const fuelPrice = num(input.fuelPrice)
    const tankSize = num(input.tankSize)
    const tanks = num(input.tanks)
    const otherCosts = num(input.otherCosts)
    const jobPrice = num(input.jobPrice)

    const truckMiles = distance * (input.roundTrip ? 2 : 1)
    const truckGallons = truckMiles / Math.max(mpg, 0.1)
    const truckFuelCost = truckGallons * fuelPrice
    const equipmentGallons = tankSize * tanks
    const equipmentFuelCost = equipmentGallons * fuelPrice
    const equipmentCost = (vehicleCost + equipmentCostPerDay) * days
    const totalCost = equipmentCost + truckFuelCost + equipmentFuelCost + otherCosts
    const profit = jobPrice - totalCost
    const profitPct = totalCost > 0 ? (profit / totalCost) * 100 : 0
    const marginPct = jobPrice > 0 ? (profit / jobPrice) * 100 : 0

    return {
        truckMiles: safe(truckMiles),
        truckGallons: safe(truckGallons),
        truckFuelCost: safe(truckFuelCost),
        equipmentGallons: safe(equipmentGallons),
        equipmentFuelCost: safe(equipmentFuelCost),
        equipmentCost: safe(equipmentCost),
        totalCost: safe(totalCost),
        profit: safe(profit),
        profitPct: safe(profitPct),
        marginPct: safe(marginPct),
        breakEvenPrice: safe(totalCost),
    }
}
