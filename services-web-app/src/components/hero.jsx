import '../styles/hero.css';

const Hero = () => {
    return (
        <div className="hero-area">
            <div className="hero-container">
                <div className="hero-intro">
                    <h2>Reliable Home Services, Book in Minutes</h2>
                    <p>Connect with trusted handymen and cleaning professionals through one simple, secure platform.
                    </p>
                <div classname = "hero-image">
                    <img src={require('../assets/hero-image.jpg')} alt="Hero" />
                </div>
                </div>
            </div>
        </div>
    );
};


export default Hero;