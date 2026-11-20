// A local stand-in for the model. When OPENAI_API_KEY is empty or a
// placeholder (see DEMO_KEY_PREFIXES in ai.ts), replies come from the sample
// answers below instead of the Freebuff API. Everything else is real: the
// message is stored, the reply streams token by token, stop and regenerate
// work, and today's usage still counts. Nothing here leaves the Worker and
// nothing here is billed.
//
// Swap in a real key and this file is never reached.

import type { ChatMessage } from './ai'

/** Sample answers, also used to seed the development user's chats. */
export const SAMPLE = {
  coldBrew: `Cold brew is mostly patience. You need coarse-ground coffee, cold water and 12 to 18 hours.

**Ratio**: start with 1 part coffee to 8 parts water by weight for a concentrate (for example 100 g coffee to 800 g water), then dilute 1:1 with water or milk when serving.

**Steps**

1. Grind the coffee coarse, like rough sea salt. A fine grind turns bitter and is hard to filter.
2. Combine coffee and cold water in a jar, stir until every ground is wet, and cover.
3. Steep in the fridge for 12 to 18 hours. Longer is stronger, not better; past 24 hours it goes flat.
4. Strain through a fine sieve lined with a paper filter or cheesecloth. Do not press the grounds.
5. Keep the concentrate in a sealed bottle in the fridge.

If it tastes thin, use more coffee next time rather than steeping longer.`,
  coldBrewKeep: `About **two weeks** in a sealed container in the fridge. It is best in the first week; after that it slowly loses its brightness and picks up a flat, cardboard note.

Two things shorten its life: leaving grounds in it (strain fully) and storing it at room temperature. Once you dilute with milk, treat it like the milk and drink it within a couple of days.`,
  cats: `Adopting a cat is mostly about matching the cat to your home and budget. A few things worth knowing first:

**Cost**: roughly $900–$1,500 in the first year for food, litter, vet visits, vaccinations, flea treatment and a carrier, then less after that. Pet insurance is optional but worth pricing.

**Time**: 15–20 minutes of play a day plus daily litter cleaning. Cats are independent, not maintenance-free.

**Home**: a window, a scratching post and somewhere high to sit matter more than toys. Check that your lease allows pets, and screen the windows before the cat arrives.

**Health**: ask for vaccination and deworming records and whether the cat is already neutered. A vet check in the first week catches most surprises.

Two cats from the same litter are often easier than one: they keep each other company.`,
  interest: `**Compound interest** is interest that earns interest. Each period the interest is added to the balance, so the next period's interest is calculated on a larger amount.

Say you invest **$1,000** at **5% a year**, compounded yearly:

| Year | Balance |
| --- | --- |
| 0 | $1,000.00 |
| 1 | $1,050.00 |
| 5 | $1,276.28 |
| 10 | $1,628.89 |
| 20 | $2,653.30 |

The formula is \`A = P × (1 + r/n)^(n·t)\`, where \`P\` is the starting amount, \`r\` the yearly rate, \`n\` the compounds per year and \`t\` the years.

The important part is time rather than the rate: at 5% your money doubles in about 14 years, and the last ten years add more than the first ten.`,
  email: `**Subject:** Following up on invoice #1042

Hi Dana,

I hope you are well. I wanted to follow up on invoice #1042 for $2,400, which was due on 3 November.

Could you let me know whether it is scheduled for payment, or if anything is holding it up on your side? If the invoice needs reissuing to a different address or reference number, I can send a corrected copy today.

If it has already gone out, please ignore this note — and thank you.

Best regards,
Alex Morgan
Accounts, Example Studio
alex@example.com · +1 555 0142`,
  sql: `Assuming an \`orders\` table with \`id\`, \`customer_id\`, \`total_cents\` and \`created_at\`:

\`\`\`sql
SELECT id, customer_id, total_cents, created_at
FROM orders
WHERE customer_id = :customer_id
ORDER BY created_at DESC
LIMIT 10;
\`\`\`

Notes:

- \`ORDER BY created_at DESC\` is what makes them "most recent". Without it, \`LIMIT 10\` returns ten arbitrary rows.
- If \`created_at\` is stored as text, store it as ISO 8601 (\`2026-11-20T14:03:00Z\`) so string order matches time order.
- Add \`AND status = 'paid'\` if you only want completed orders, and an index on \`(customer_id, created_at DESC)\` to keep it fast as the table grows.`,
  code: `Here is a small typed React component with a loading state:

\`\`\`tsx
import { useEffect, useState } from 'react'

type User = { id: string; name: string }

export function UserCard({ id }: { id: string }) {
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch(\`/api/users/\${id}\`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(\`HTTP \${r.status}\`))))
      .then(setUser)
      .catch((e: unknown) => {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Failed')
      })
    return () => controller.abort()
  }, [id])

  if (error) return <p role="alert">{error}</p>
  if (!user) return <p>Loading…</p>
  return <p>{user.name}</p>
}
\`\`\`

The \`AbortController\` in the cleanup is what stops a stale response overwriting a newer one when \`id\` changes quickly.`,
}

const RULES: { match: RegExp; answer: string }[] = [
  { match: /cold brew|cold-brew|coffee/, answer: SAMPLE.coldBrew },
  { match: /keep|last|shelf life|store|storage/, answer: SAMPLE.coldBrewKeep },
  { match: /cat|kitten|adopt/, answer: SAMPLE.cats },
  { match: /compound interest|interest rate|invest|savings/, answer: SAMPLE.interest },
  { match: /invoice|follow-up|follow up|email/, answer: SAMPLE.email },
  { match: /\bsql\b|query|database|select .* from/, answer: SAMPLE.sql },
  { match: /react|typescript|component|useeffect|hook/, answer: SAMPLE.code },
]

const GREETING = `Hello! What would you like to work on?

You can paste code and ask for a review, describe a problem and ask for a plan, or ask me to draft something. A few things I am good at:

- explaining a concept with a short example
- turning a rough idea into an outline
- writing and reviewing code
- tightening text you paste in`

const THANKS = `You are welcome. Tell me if you want the next step: an example, a shorter version, or the same thing applied to your own data.`

const lastQuestion = (messages: ChatMessage[]) =>
  [...messages].reverse().find((message) => message.role === 'user')?.content.trim() ?? ''

const topicOf = (question: string) => {
  const cleaned = question.replace(/\s+/g, ' ').replace(/[?.!]+$/, '').trim()
  return cleaned.length > 72 ? `${cleaned.slice(0, 72).replace(/\s+\S*$/, '')}…` : cleaned
}

/** The generic replies, chosen from the shape of the question. */
function genericAnswer(question: string): string {
  const topic = topicOf(question)
  if (/^(hi|hey|hello|yo|good (morning|afternoon|evening))\b/i.test(question)) return GREETING
  if (/^(thanks|thank you|cheers|ta)\b/i.test(question)) return THANKS
  if (/^(write|draft|compose|rewrite|summari[sz]e|translate|shorten)\b/i.test(question)) {
    return `Here is a first pass at **${topic}**:

> A short opening that states the point plainly, then one sentence of context.

Three things make this easier to read:

1. **Lead with the ask.** Put what you want in the first two lines, before the background.
2. **One idea per paragraph.** Two or three sentences is enough for each.
3. **Close with a concrete next step.** A date, a question or an offer is better than "let me know".

Send me the rough version and I will tighten it in place.`
  }
  if (/^(how|what|why|when|where|which|can|should|is|are|does|do)\b/i.test(question)) {
    return `Short answer on **${topic}**:

The useful way to think about it is to separate what you control from what you do not. In most cases the decision comes down to three checks:

- **What does success look like?** One sentence, measurable if possible.
- **What is the smallest version?** Something you can finish this week and learn from.
- **What would make you stop?** A cost, deadline or result that says the approach is wrong.

From there, work backwards from the outcome rather than forwards from the tools. If you tell me the specifics — numbers, constraints, what you have already tried — I can make this concrete instead of general.`
  }
  return `On **${topic}**, here is how I would start:

1. **Write down the goal** in one sentence. If you cannot, that is the first thing to fix.
2. **List the constraints** — time, budget, what already exists, what cannot change.
3. **Pick the smallest step that tests the idea**, rather than the complete version of it.
4. **Set a checkpoint** so you know when to continue and when to change course.

Paste the details and I will turn this into a specific plan, with the trade-offs named.`
}

/** The reply the demo mode would give to this conversation's last question. */
export function demoReply(messages: ChatMessage[]): string {
  const question = lastQuestion(messages)
  const rule = RULES.find((entry) => entry.match.test(question.toLowerCase()))
  return rule?.answer ?? genericAnswer(question)
}

/**
 * Streams the reply the way `complete` does: many small pieces, so the app's
 * caret, stop button and partial-save behaviour all get exercised.
 */
export async function* demoComplete(messages: ChatMessage[]): AsyncGenerator<string> {
  const words = demoReply(messages).match(/\S+\s*/g) ?? []
  for (let i = 0; i < words.length; i += 2) {
    yield words.slice(i, i + 2).join('')
    await new Promise((resolve) => setTimeout(resolve, 18))
  }
}
