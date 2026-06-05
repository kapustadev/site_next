import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const SUPPORTED = ['USD', 'EUR', 'UAH', 'GBP', 'CHF', 'CZK', 'HUF']
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

// NBP API: Table A — official exchange rates of NBP (National Bank of Poland)
// https://api.nbp.pl/api/exchangerates/tables/A/?format=json
// Returns rates: how much PLN for 1 unit of foreign currency

async function fetchFromNBP(): Promise<Record<string, number>> {
  const res = await fetch('https://api.nbp.pl/api/exchangerates/tables/A/?format=json', {
    next: { revalidate: 3600 }
  })
  if (!res.ok) throw new Error('NBP API недоступен')
  const data = await res.json()
  const rates: Record<string, number> = { PLN: 1 }
  for (const rate of data[0].rates) {
    if (SUPPORTED.includes(rate.code)) {
      rates[rate.code] = rate.mid
    }
  }
  return rates
}

export async function GET() {
  try {
    // Check cache — if all currencies were fetched < 1h ago, return cached
    const cached = await prisma.exchangeRateCache.findMany({
      where: { currency: { in: SUPPORTED } }
    })

    const now = Date.now()
    const allFresh = cached.length === SUPPORTED.length &&
      cached.every(c => now - new Date(c.fetchedAt).getTime() < CACHE_TTL_MS)

    let rates: Record<string, number> = { PLN: 1 }

    if (allFresh) {
      for (const c of cached) {
        rates[c.currency] = c.rateToPln
      }
    } else {
      // Fetch fresh from NBP
      rates = await fetchFromNBP()

      // Upsert into cache
      await Promise.all(
        Object.entries(rates)
          .filter(([code]) => code !== 'PLN')
          .map(([currency, rateToPln]) =>
            prisma.exchangeRateCache.upsert({
              where: { currency },
              create: { currency, rateToPln, fetchedAt: new Date() },
              update: { rateToPln, fetchedAt: new Date() }
            })
          )
      )
    }

    return NextResponse.json({
      rates,
      source: allFresh ? 'cache' : 'NBP',
      base: 'PLN',
      updatedAt: new Date().toISOString()
    })
  } catch (err: any) {
    // Fallback: return approximate rates if NBP is down
    return NextResponse.json({
      rates: { PLN: 1, USD: 4.05, EUR: 4.28, UAH: 0.097, GBP: 5.05, CHF: 4.52, CZK: 0.17, HUF: 0.011 },
      source: 'fallback',
      base: 'PLN',
      error: err.message
    })
  }
}
