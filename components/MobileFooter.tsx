import Link from 'next/link'

export default function MobileFooter() {
  return (
    <footer className="md:hidden bg-ume-indigo py-6 text-center">
      <div className="px-4">
        <div className="flex justify-center gap-4 text-xs text-white mb-3">
          <Link href="/about" className="hover:text-ume-pink transition-colors">About us</Link>
          <Link href="/contact" className="hover:text-ume-pink transition-colors">Contact</Link>
          <Link href="/privacy" className="hover:text-ume-pink transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-ume-pink transition-colors">Terms</Link>
        </div>
        <p className="text-xs text-white/70">@{new Date().getFullYear()} UME all rights reserved</p>
      </div>
    </footer>
  )
}
