import { NavLink } from 'react-router-dom'

const links = [
  { to: '/predict',   label: 'New Prediction' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/review',    label: 'Review Queue' },
]

export default function Navbar() {
  return (
    <nav className="bg-navy-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2 font-bold text-lg">
          🏦 <span>BankLoan AI</span>
        </NavLink>
        <div className="flex gap-1">
          {links.map(l => (
            <NavLink
              key={l.to} to={l.to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition
                 ${isActive ? 'bg-white text-navy-600' : 'text-white/80 hover:bg-white/10'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
