export default function Tabs({ children, buttons, ButtonsContainer = 'menu' }) {
  // buttons are SLOT
  // buttons are coming from Examples.jsx
  // ButtonsContainer is a prop with Capitalized name that allows you to specify a custom component to be used as the container for the buttons. This can be useful if you want to apply specific styling or behavior to the button container, or if you want to use a different HTML element for the container (e.g., a <div> instead of a <ul>).
  return (
    <>
      <ButtonsContainer>{buttons}</ButtonsContainer>
      {children}
    </>
  );
}
