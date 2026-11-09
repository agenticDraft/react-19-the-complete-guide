export default function Input({ label, invalid, ...props }) {
  let labelClasses = 'block mb-2 text-xs font-bold tracking-wide uppercase';
  if (invalid) {
    labelClasses += ' text-red-500';
  } else {
    labelClasses += ' text-gray-500';
  }

  let inputClasses = 'w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow';
  if (invalid) {
    inputClasses += ' border-red-500';
  } else {
    inputClasses += ' border-gray-300';
  }
  
  return (
    <p>
      <label className={labelClasses}>{label}</label>
      <input
        className={inputClasses}
        {...props}
      />
    </p>
  );
}
