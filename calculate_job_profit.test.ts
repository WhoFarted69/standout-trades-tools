import { calculate_job_profit } from "./calculate_job_profit.ts"

const result = calculate_job_profit({
    vehicleCost: 120,
    equipmentCost: 180,
    days: 1,
    mpg: 15,
    distance: 25,
    roundTrip: true,
    fuelPrice: 3.19,
    tankSize: 5,
    tanks: 1,
    otherCosts: 40,
    jobPrice: 650,
})
console.log(JSON.stringify(result, null, 2))

// Expected values worked out by hand from the formulas.
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6
const ok =
    result.truckMiles === 50 &&
    near(result.truckGallons, 50 / 15) &&
    near(result.truckFuelCost, (50 / 15) * 3.19) &&
    result.equipmentGallons === 5 &&
    near(result.equipmentFuelCost, 15.95) &&
    result.equipmentCost === 300 &&
    near(result.totalCost, 300 + (50 / 15) * 3.19 + 15.95 + 40) &&
    near(result.profit, 650 - result.totalCost) &&
    near(result.profitPct, (result.profit / result.totalCost) * 100) &&
    near(result.marginPct, (result.profit / 650) * 100) &&
    result.breakEvenPrice === result.totalCost

// Bad inputs collapse to 0, no NaN/Infinity.
const bad = calculate_job_profit({ vehicleCost: NaN, days: -3, mpg: Infinity, distance: "", jobPrice: null })
const badOk = Object.values(bad).every((v) => v === 0)

console.log(ok && badOk ? "PASS" : "FAIL")
process.exit(ok && badOk ? 0 : 1)
