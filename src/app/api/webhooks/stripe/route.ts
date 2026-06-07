import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature') as string

  let event

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set')
    }
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any
    const invoiceId = session.metadata?.invoiceId

    if (invoiceId) {
      // 1. Update invoice status
      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'PAID' }
      })

      // 2. Create transaction record for the business owner
      await prisma.transaction.create({
        data: {
          type: 'INCOME',
          category: 'Оплата счета',
          description: updatedInvoice.description || 'Оплата по счету',
          amount: updatedInvoice.amount,
          projectId: updatedInvoice.projectId,
        }
      })
      console.log(`Invoice ${invoiceId} paid and transaction created.`)
    }
  }

  return NextResponse.json({ received: true })
}
