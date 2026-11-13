import { useState } from "react";
import CustomInput from "./CustomInput.jsx";
import { isEmail, isNotEmpty, hasMinLength } from "../util/validation.js";

export default function LoginUseStateApproach() {
  const [enteredEmail, setEnteredEmail] = useState("");
  const [enteredPassword, setEnteredPassword] = useState("");

  const [enteredValues, setEnteredValues] = useState({
    email: "",
    password: "",
  });

  const [didEdit, setDidEdit] = useState({
    email: false,
    password: false,
  });

  const emailIsInvalid =
    didEdit.email &&
    !isEmail(enteredValues.email) &&
    !isNotEmpty(enteredValues.email);

  const passwordIsInvalid =
    didEdit.password && !hasMinLength(enteredValues.password, 6);

  // to pass 'identifier' we need to onChange={(event) => handleInputChange("email", event.target.value)}
  function handleInputChange(identifier, value) {
    setEnteredValues((prevValues) => ({
      ...prevValues,
      [identifier]: value, // [identifier] => dynamically access property in the object
    }));
  }

  function handleInputBlur(identifier, value) {}

  function handleSubmit(event) {
    event.preventDefault(); // standard way
    // instead event, react 19 have formActions hook
    console.log("Submitted!");
    // by default button inside the <form> element will automatically create and send http request to the server,
    // also it will append params in URL which get in the form, in this case:http://localhost:5173/?email=&password=
    // solution we need to prevent default behavior of the button, by adding type="button"
    // better way is to add onSubmit to the form element  <form onSubmit={handleSubmit}>
    console.log(enteredEmail, enteredPassword);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      <div className="control-row">
        <CustomInput
          label="email"
          id="email"
          type="email"
          onBlur={() => handleInputBlur("email")}
          onChange={(event) => handleInputChange("email", event.target.value)}
          value={enteredValues.email}
          error={emailIsInvalid && "Please enter a valid email"}
        />

        <CustomInput
          label="password"
          id="password"
          type="password"
          onBlur={() => handleInputBlur("password")}
          onChange={(event) =>
            handleInputChange("password", event.target.value)
          }
          value={enteredValues.password}
          error={passwordIsInvalid && "Please enter a valid password"}
        />
      </div>

      <p className="form-actions">
        <button className="button button-flat">Reset</button>
        <button className="button">Login</button>
      </p>
    </form>
  );
}
