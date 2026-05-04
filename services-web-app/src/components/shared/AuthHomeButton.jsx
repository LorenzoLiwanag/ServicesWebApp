import { Link } from "react-router-dom";

const AuthHomeButton = () => {
  return (
    <Link className="auth-home-button" to="/" aria-label="Go to landing page">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m3 10.5 9-7 9 7" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
      </svg>
    </Link>
  );
};

export default AuthHomeButton;
