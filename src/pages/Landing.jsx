import Nav from '../components/Nav.jsx';
import MyImage from '../headshots/neural_gator.png';

export default function Landing() {
  return (
    <div>
      <Nav />
      <section style={{ padding: 24 }}>
        <h1 style={{ textAlign: 'left' }}>GatorMind</h1>
        <h2 style={{ textAlign: 'left' }}>A Visual Analytics Tool For Neural Networks</h2>

        <div style={{ textAlign: 'center', marginBottom: 5 }}>
          <img 
            src={MyImage} 
            alt="neural_gator" 
            style={{ maxWidth: '35%', height: 'auto', display: 'inline-block' }}
          />
        </div>

        <p style={{ marginTop: 0 }}>
          Welcome to GatorMind! This is a tool used to visualize models and datasets for neural networks. Please use the navigation bar at the top of the page to Sign In to begin working or navigate to Team to learn more about us.
        </p>
      </section>
    </div>
  );
}
