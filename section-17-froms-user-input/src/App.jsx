import Header from "./components/Header.jsx";
import LoginUseInputHookApproach from "./components/LoginUseStateApproach.jsx";
import Signup from "./components/Signup.jsx";

function App() {
  return (
    <>
      <Header />
      <main>
        <LoginUseInputHookApproach />
        {/* <LoginUseStateApproach /> */}
        <Signup />
      </main>
    </>
  );
}

export default App;
