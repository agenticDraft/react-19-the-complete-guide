export default function TabButton({ children, isSelected, ...forwardedProps }) {
  return (
    <li>
      <button
        className={`tab-button ${isSelected ? "active" : ""}`}
        {...forwardedProps} //onClick is Examples.jsx
      >
        {children}
      </button>
    </li>
  );
}
