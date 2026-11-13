import { useState } from "react"; // everything which start with "use" are react hooks, which are special functions that allow you to "hook into" React features. useState is a hook that allows you to add state to functional components.
import { EXAMPLES } from "../../data.js";
import TabButton from "../TabButton/TabButton.jsx";
import Section from "../Section.jsx";
import Tabs from "../Tabs/Tabs.jsx";

export default function Examples() {
  const [selectedTab, setSelectedTab] = useState(); // useState is a hook that allows you to add state to functional components. It returns an array with two elements: the current state value and a function to update it. The initial state value can be passed as an argument to useState.

  function handleTabSelect(tabName) {
    console.log(`${tabName} tab selected!`);
    setSelectedTab(tabName);
  }

  let tabContent = <p>Please select a topic.</p>;
  if (selectedTab) {
    tabContent = (
      <div id="tab-content">
        <h3>{EXAMPLES[selectedTab].title}</h3>
        <p>{EXAMPLES[selectedTab].description}</p>
        <pre>
          <code>{EXAMPLES[selectedTab].code}</code>
        </pre>
      </div>
    );
  }

  return (
    // ...forwardedProps allows you to pass any additional props to the Section component, like id, className, etc. This is useful for making the component more flexible and reusable.
    <Section title="Examples" id="examples" className="examples">
      <Tabs
        // For built in HTML elements, you can use the string name of the element as the value for the ButtonsContainer prop. For example, if you want to use a <div> element as the container for the buttons, you can pass "div" as the value for the ButtonsContainer prop. If you want to use a <menu> element, you can pass "menu" as the value for the ButtonsContainer prop. If you don't pass any value for the ButtonsContainer prop, it will default to "menu".
        // For custom components, you can pass the component itself as the value for the ButtonsContainer prop. For example, if you have a custom component called MyButtonContainer, you can pass MyButtonContainer as the value for the ButtonsContainer prop. This will render your custom component as the container for the buttons.
        // It's important to note that prop need to be UpperCamelCase when passing a component as a prop, and lowercase when passing a string name of an HTML element. This is because React uses the naming convention to differentiate between custom components and built-in HTML elements.
        ButtonsContainer="menu"
        buttons={
          <>
            <TabButton
              isSelected={selectedTab === "components"}
              onClick={() => handleTabSelect("components")}
            >
              Components
            </TabButton>
            <TabButton
              isSelected={selectedTab === "jsx"}
              onClick={() => handleTabSelect("jsx")}
            >
              JSX
            </TabButton>
            <TabButton
              isSelected={selectedTab === "props"}
              onClick={() => handleTabSelect("props")}
            >
              Props
            </TabButton>
            <TabButton
              isSelected={selectedTab === "state"}
              onClick={() => handleTabSelect("state")}
            >
              State
            </TabButton>
          </>
        }
      >
        {tabContent}
      </Tabs>
    </Section>
  );
}
