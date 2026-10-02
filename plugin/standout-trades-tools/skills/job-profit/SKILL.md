---
name: job-profit
description: Estimate the profit, total cost, profit percentage, margin, and break-even price of a contractor or home-service job using the calculate_job_profit tool.
---

# Job Profit

Use the `calculate_job_profit` tool whenever a user wants to estimate whether a contractor or home-service job (tree service, landscaping, excavation, general contracting, and similar) will make money, or what they should charge.

## Required inputs

The tool needs all 11 of these values. Do not call it until you have every one:

- `vehicleCost`: truck or vehicle cost per day, in dollars
- `equipmentCost`: equipment cost per day, in dollars (rented or owned)
- `days`: number of days on the job
- `mpg`: truck fuel economy in miles per gallon
- `distance`: one-way distance to the customer, in miles
- `roundTrip`: true if the truck drives the distance both ways, false for one way only
- `fuelPrice`: fuel price per gallon, in dollars
- `tankSize`: equipment fuel tank size, in gallons
- `tanks`: number of equipment tanks used on the job
- `otherCosts`: other job costs in dollars (dump fees, materials, and so on)
- `jobPrice`: amount charged to the customer, in dollars

## How to work

1. Collect any missing inputs by asking the user. Ask for everything that is missing in one short message.
2. Never invent or assume a price, distance, fuel usage, MPG, or cost. If the user says a cost does not apply, use 0 for that field only when they have said so.
3. Call `calculate_job_profit` with the values the user supplied.
4. Use the tool's results. Do not recalculate them or reproduce the formulas yourself, and do not adjust the numbers it returns.

## Explaining the result

Explain these returned values in plain, direct language:

- Total cost: everything the job costs, including truck, equipment, fuel, and other costs.
- Profit: the customer price minus total cost. A negative number is a loss.
- Profit percentage: profit as a percentage of cost (return on cost). It can be above 100%.
- Margin: profit as a percentage of the customer price.
- Break-even price: the lowest price that covers total cost.

Say clearly that these are estimates based only on the values the user provided, and that the results are only as accurate as those inputs.
