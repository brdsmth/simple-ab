import './Header.css'

const Header = () => {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <h2>SimpleAB</h2>
          </div>
          <nav className="nav">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="header-actions">
            <a href="#" className="btn btn-secondary">Sign In</a>
            <a href="#" className="btn btn-primary">Get Started</a>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
