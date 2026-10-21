import { formatFcfa } from './money'
import type { Lang } from './types'

export function reminderText(input: {
  lang: Lang
  customer: string
  shopName: string
  amount: number
}): string {
  const amount = formatFcfa(input.amount)
  const shop = input.shopName.trim()
  if (input.lang === 'fr') {
    const who = shop ? `, c’est ${shop}` : ''
    return `Bonjour ${input.customer}${who}. Petit rappel amical : il reste ${amount} sur votre ardoise. Merci, et à bientôt.`
  }
  const who = shop ? `, this is ${shop}` : ''
  return `Hello ${input.customer}${who}. A friendly reminder: ${amount} is still on your tab. Thank you.`
}

export function whatsappHref(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, '')
  const path = digits.length >= 8 ? digits : ''
  return `https://wa.me/${path}?text=${encodeURIComponent(text)}`
}
