export default function Signup() {
  function signupAction(formData) {
    const email = formData.get("email"); // get it via name attribute from INPUT
  }

  return (
    <form action={signupAction}>
      <h2>Welcome on board form</h2>
      <div className="control">
        <label htmlFor="email">Email</label>
        <input name="email" id="email" type="email" />
      </div>
    </form>
  );
}
