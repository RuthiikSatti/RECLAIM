'use client'

/**
 * Client-side loader for FloatingChatWidget
 *
 * This component allows dynamic import of the chat widget
 * from Server Components without SSR
 */

import dynamic from 'next/dynamic'

const FloatingChatWidget = dynamic(() => import('./FloatingChatWidget'), {
  ssr: false,
  loading: () => null
})

export default FloatingChatWidget
