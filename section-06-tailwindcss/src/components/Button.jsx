export default function Button({ children, ...props }) {
  return (
    <button
      className="px-4 py-2 font-semibold uppercase rounded-lg text-gray-800 bg-yellow-400 hover:bg-yellow-500 border-none"
      {...props}
    >
      {children}
    </button>
  );
}
