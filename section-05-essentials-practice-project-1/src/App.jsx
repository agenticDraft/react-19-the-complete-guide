import { useState } from "react";

import Header from "./Components/Header/Header";
import UserInput from "./Components/UserInput/UserInput";
import Results from "./Components/Results/Results";

function App() {
  const [userInput, setUserInput] = useState({
    initialInvestment: 10000,
    annualInvestment: 1200,
    expectedReturn: 6,
    duration: 10,
  });

  const inputIsValid = userInput.duration > 0;

  const handleChange = (inputIdentifier, newValue) => {
    setUserInput((prevUserInput) => ({
      ...prevUserInput,
      [inputIdentifier]: +newValue,
    }));
  };

  return (
    <>
      <Header />
      <main>
        <UserInput userInput={userInput} handleChange={handleChange} />
        {!inputIsValid && (
          <p className="error-text center">
            Please enter a valid duration (greater than 0)
          </p>
        )}
        {inputIsValid && <Results userInput={userInput} />}
      </main>
    </>
  );
}

export default App;
