import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
  console.error('Usage: npx tsx scripts/reset-password.ts <email> <password>')
  process.exit(1)
}

async function main() {
  const admin = createClient(url, serviceKey)
  const { data: list, error: listErr } = await admin.auth.admin.listUsers()
  if (listErr) throw listErr
  const user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) {
    console.error(`User not found: ${email}`)
    process.exit(1)
  }
  const { error } = await admin.auth.admin.updateUserById(user.id, { password })
  if (error) throw error
  console.log(`Password updated for ${email} (${user.id})`)
}

main().catch((e) => { console.error(e); process.exit(1) })
