import React from 'react'
import MobileNavbar from './MobileNavbar'
import DesktopNavbar from './DesktopNavbar'

function Navbar() {
  return (
    <nav
      className="relative bg-base-300 text-base-content overflow-hidden"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Simplified Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/8 to-accent/8"></div>

      {/* Elegant Border Accent */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>

      {/* Mobile Navbar Component */}
      <MobileNavbar />

      {/* Desktop Navbar Component */}
      <DesktopNavbar />
    </nav>
  )
}

export default Navbar
