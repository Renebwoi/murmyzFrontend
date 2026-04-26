import { useNavigate } from "react-router-dom";
import { ROUTES } from "./constants/api";
import "./App.css";

function App() {
  const navigate = useNavigate();

  return (
    <div className="public-site">
      {/* Header */}
      <header className="public-header">
        <div className="header-container">
          <h1 className="logo">🏨 Murmyz Hotel</h1>
          <nav className="nav-links">
            <button className="nav-link" onClick={() => navigate("/")}>
              Home
            </button>
            <button className="nav-link" onClick={() => navigate("/")}>
              Rooms
            </button>
            <button className="nav-link" onClick={() => navigate("/")}>
              Contact
            </button>
            <button
              className="nav-link admin-link"
              onClick={() => navigate(ROUTES.ADMIN_LOGIN)}
            >
              Staff Login
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h2>Welcome to Murmyz Hotel</h2>
          <p>Experience luxury and comfort in the heart of the city</p>
          <button className="cta-button">Book Now</button>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h3>Why Choose Us?</h3>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🛏️</div>
            <h4>Comfortable Rooms</h4>
            <p>Spacious and well-appointed rooms with modern amenities</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👨‍💼</div>
            <h4>Professional Service</h4>
            <p>Expert staff dedicated to making your stay memorable</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🍽️</div>
            <h4>Dining Options</h4>
            <p>Multiple restaurants and bars with diverse cuisines</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🏊</div>
            <h4>Facilities</h4>
            <p>Swimming pool, spa, fitness center, and more</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="public-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>About</h4>
            <p>
              Murmyz Hotel offers premium accommodation and services for
              travelers and guests.
            </p>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p>
              Email: info@murmyz.com
              <br />
              Phone: +1 (555) 123-4567
            </p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li>
                <button className="footer-link" onClick={() => navigate("/")}>
                  Home
                </button>
              </li>
              <li>
                <button className="footer-link" onClick={() => navigate("/")}>
                  Rooms
                </button>
              </li>
              <li>
                <button
                  className="footer-link"
                  onClick={() => navigate(ROUTES.ADMIN_LOGIN)}
                >
                  Staff
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Murmyz Hotel. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
