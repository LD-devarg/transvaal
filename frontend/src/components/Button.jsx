import '../assets/css/Button.css';

export default function Button({ onClick, children, className = '' }) {
    return (
        <button
            onClick={onClick}
            className={`custom-button ${className}`}
        >
            {children}
        </button>
    );
}