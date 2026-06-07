import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { invoiceId } = await req.json()
    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    })

    if (!invoice || invoice.clientId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.status === 'PAID') {
      return NextResponse.json({ error: 'Invoice is already paid' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'pln',
            product_data: {
              name: invoice.description || 'Оплата счета Studio Flow',
            },
            unit_amount: Math.round(invoice.amount * 100), // in cents/groszy
          },
          quantity: 1,
        },
      ],
      metadata: {
        invoiceId: invoice.id,
      },
      success_url: `${appUrl}/ru/dashboard?payment=success`,
      cancel_url: `${appUrl}/ru/dashboard?payment=cancelled`,
    })

    return NextResponse.json({ url: stripeSession.url })
  } catch (err: any) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
