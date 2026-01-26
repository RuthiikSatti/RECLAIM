import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us - UME',
  description: 'Learn about UME - the student marketplace built for students, by students',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-ume-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* What's UME? - Centered Section */}
        <div className="text-center mb-20">
          <h1 className="heading-primary mb-8">
            WHAT'S <span className="text-ume-indigo">U</span><span className="text-ume-pink">M</span><span className="text-ume-pink">E</span>?
          </h1>
          <div className="max-w-3xl mx-auto">
            <p className="text-lg text-black leading-relaxed mb-4">
              We're two university students, Ruthiik and Bryndis, who kept running into the same problem — it was always a hassle to buy or sell things safely on campus. From textbooks to dorm furniture, everything felt scattered or overpriced. So, we decided to build the solution we wished existed: a marketplace just for students.
            </p>
            <p className="text-lg text-black leading-relaxed mb-4">
              Every user is verified through their university email, ensuring a safe and local experience.
            </p>
            <p className="text-lg text-black leading-relaxed font-semibold">
              Our mission is simple — make campus life more affordable, sustainable, and connected.
            </p>
          </div>
        </div>

        {/* Our Values Section - Picture + Text */}
        <div className="mb-20">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Placeholder for picture - left side */}
            <div className="bg-gray-200 rounded-lg aspect-square flex items-center justify-center">
              <p className="text-gray-400 text-sm">Image placeholder</p>
            </div>

            {/* Our Values Text - right side */}
            <div>
              <h2 className="heading-primary mb-6" style={{ fontSize: '2rem' }}>
                OUR VALUES
              </h2>
              <div className="space-y-4 text-lg text-black leading-relaxed">
                <p>We believe in trust, sustainability, and community.</p>
                <p>Every trade should feel safe, fair, and student-first.</p>
                <p>By keeping items in use and on campus, we help each other — and the planet.</p>
              </div>
            </div>
          </div>
        </div>

        {/* For Students, By Students Section */}
        <div className="text-center mb-12">
          <h2 className="heading-primary mb-12">
            FOR STUDENTS, BY STUDENTS
          </h2>

          {/* Three Pillars with Icons */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Affordable */}
            <div className="flex flex-col items-center">
              <div className="bg-gray-200 rounded-lg w-48 h-48 mb-4 flex items-center justify-center">
                <p className="text-gray-400 text-sm">Affordable icon</p>
              </div>
              <h3 className="text-xl font-bold text-ume-indigo">Affordable</h3>
            </div>

            {/* Sustainable */}
            <div className="flex flex-col items-center">
              <div className="bg-gray-200 rounded-lg w-48 h-48 mb-4 flex items-center justify-center">
                <p className="text-gray-400 text-sm">Sustainable icon</p>
              </div>
              <h3 className="text-xl font-bold text-ume-indigo">Sustainable</h3>
            </div>

            {/* Connected */}
            <div className="flex flex-col items-center">
              <div className="bg-gray-200 rounded-lg w-48 h-48 mb-4 flex items-center justify-center">
                <p className="text-gray-400 text-sm">Connected icon</p>
              </div>
              <h3 className="text-xl font-bold text-ume-indigo">Connected</h3>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
