import { useRef } from "react";

export default function LoginUseRefApproach() {
  const email = useRef();
  const password = useRef();

  function handleSubmit(event) {
    event.preventDefault(); // standard way
    // instead event, react 19 have formActions hook
    console.log("Submitted!");
    // by default button inside the <form> element will automatically create and send http request to the server,
    // also it will append params in URL which get in the form, in this case:http://localhost:5173/?email=&password=
    // solution we need to prevent default behavior of the button, by adding type="button"
    // better way is to add onSubmit to the form element  <form onSubmit={handleSubmit}>

    const enteredEmail = email.current.value;
    const enteredPassword = password.current.value;

    console.log(enteredEmail, enteredPassword);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>

      <div className="control-row">
        <div className="control no-margin">
          {/* "htmlFor" is equivalent to HTML "for" */}
          <label htmlFor="email">Email</label>
          <input id="email" type="email" name="email" ref={email} />
        </div>

        <div className="control no-margin">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" name="password" ref={password} />
        </div>
      </div>

      <p className="form-actions">
        <button className="button button-flat">Reset</button>
        <button className="button">Login</button>
      </p>
    </form>
  );
}
