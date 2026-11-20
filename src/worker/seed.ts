// Sample conversations for the local development user, so the app has
// something to show before an API key is configured. They are only ever
// written in development mode (see routes/account.ts); real accounts start
// empty. One is recent, one is yesterday's and one is a few days old, so the
// sidebar's date groups, renaming and the usage counter all have data.

import { DEFAULT_MODEL } from '../shared/config'
import { id, now, titleFrom } from './db'
import { SAMPLE } from './demo'

export const WELCOME_CONVERSATION_ID = 'welcome'

const HOUR = 60 * 60_000
const DAY = 24 * HOUR

const samples: { id: string; ago: number; turns: [string, string][] }[] = [
  {
    id: WELCOME_CONVERSATION_ID,
    ago: 2 * HOUR,
    turns: [
      ['How do I make cold brew coffee at home?', SAMPLE.coldBrew],
      ['How long does the concentrate keep?', SAMPLE.coldBrewKeep],
    ],
  },
  {
    id: 'sample-sql',
    ago: 26 * HOUR,
    turns: [
      ['Write a SQL query that finds my ten most recent orders', SAMPLE.sql],
      ['How do I make that fast on a large table?', `Add a composite index that matches the filter and the sort:\n\n\`\`\`sql\nCREATE INDEX orders_customer_recent\n  ON orders (customer_id, created_at DESC);\n\`\`\`\n\nThe database can then walk the index in order and stop after ten rows, instead of scanning and sorting every order for that customer. Check it with \`EXPLAIN QUERY PLAN\` on SQLite, \`EXPLAIN ANALYZE\` on PostgreSQL: you want an index scan with no separate sort step.\n\nTwo things to watch: keep the index columns in that order (equality first, then the sorted column), and drop indexes you no longer use — each one makes writes slower.`],
    ],
  },
  {
    id: 'sample-email',
    ago: 3 * DAY,
    turns: [
      ['Draft a polite follow-up email about a late invoice', SAMPLE.email],
      ['Make it shorter', `**Subject:** Invoice #1042 — quick follow-up\n\nHi Dana,\n\nJust following up on invoice #1042 for $2,400, due 3 November. Is it scheduled for payment, or is anything holding it up?\n\nHappy to reissue it with a different reference if that helps. If it is already on its way, please ignore this.\n\nThanks,\nAlex`],
    ],
  },
]

export function seedStatements(db: D1Database, owner: string) {
  const statements: D1PreparedStatement[] = []
  for (const sample of samples) {
    const start = now() - sample.ago
    const statementsForSample: D1PreparedStatement[] = [
      db
        .prepare(`INSERT INTO conversations (id, owner_sub, title, model, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`)
        .bind(sample.id, owner, titleFrom(sample.turns[0]![0]), DEFAULT_MODEL, start, start + sample.turns.length * 2 * 60_000),
    ]
    sample.turns.forEach(([question, answer], i) => {
      const at = start + i * 2 * 60_000
      statementsForSample.push(
        db
          .prepare(`INSERT INTO messages (id, owner_sub, conversation_id, role, content, model, created_at) VALUES (?, ?, ?, 'user', ?, NULL, ?)`)
          .bind(id(), owner, sample.id, question, at),
        db
          .prepare(`INSERT INTO messages (id, owner_sub, conversation_id, role, content, model, created_at) VALUES (?, ?, ?, 'assistant', ?, ?, ?)`)
          .bind(id(), owner, sample.id, answer, DEFAULT_MODEL, at + 9_000),
      )
    })
    statements.push(...statementsForSample)
  }
  return statements
}
