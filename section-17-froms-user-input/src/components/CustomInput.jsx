export default function CustomInput({ label, id, error, ...props }) {
  return (
    <div className="control no-margin">
      {/* "htmlFor" is equivalent to HTML "for" */}
      <label htmlFor={id}>Email</label>
      <input id={id} {...props} />
      <div className="control-error">{error && <p>{error}</p>}</div>
    </div>
  );
}
