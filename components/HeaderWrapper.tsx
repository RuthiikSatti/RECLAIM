import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/actions'
import { getCartCount } from '@/lib/cart/actions'
import Header from './Header'

export default async function HeaderWrapper() {
  const supabase = await createClient()
  const user = await getUser()

  let unreadMessages = 0
  let cartItemCount = 0

  if (user) {
    // Get unread message count
    const { count: messageCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('read', false)
      .eq('deleted', false)

    unreadMessages = messageCount || 0

    // Get cart item count
    cartItemCount = await getCartCount()
  }

  return (
    <Header
      unreadMessages={unreadMessages}
      cartItemCount={cartItemCount}
      userAvatar={user?.user_metadata?.avatar_url}
      userId={user?.id}
    />
  )
}
