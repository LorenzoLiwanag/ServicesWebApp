import styles from '../styles/login.css';

const LoginForm = () => {
    return (
        <div className="loginForm-area"> 
            <form className="loginForm">
                <div className="loginForm-title">
                    <h1>Login to your Subic Bay Home Services Account</h1>
                </div>
                <div className="form-group">
                    <label htmlFor="username">Username:</label>
                    <input type="text" id="username" name="username" required />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input type="password" id="password" name="password" required />
                </div>
                <button type="submit">Login</button>
                <a className='login-links form-group' href="/register">Don't have an account? Register here.</a>
                <a className='login-links form-group' href="/forgot-password">Forgot your password?</a>
            </form> 
        </div>
    );
}
export default LoginForm;