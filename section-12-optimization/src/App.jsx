import { useState } from "react";
import Counter from "./components/Counter/Counter.jsx";
import SetCounter from "./components/SetCounter/SetCounter.jsx";
import Header from "./components/Header.jsx";
import { log } from "./log.js";
import CounterWithHistory from "./components/Counter/CounterWithHistory.jsx";

function App() {
  log("<App /> rendered");
  // // const runs on every render
  // // when state changes, the whole App() function is re-rendered
  // const [enteredNumber, setEnteredNumber] = useState(0);
  const [chosenCount, setChosenCount] = useState(0);

  // setChosenCount ne menja counter odmah. On samo zakaže promenu (scheduling). React zatim sve promene iz istog klika obradi zajedno, u jednom renderu (batching).
  // Šta React stvarno dobija
  // counter je obična const vrednost unutar jednog poziva funkcije Counter(). Kad pozoveš setCounter(...), React samo zapiše ceduljicu "promeni counter" i stavi je u red. Tekući poziv funkcije završava sa starim counter. Tek posle tvog handlera React pročita sve ceduljice, ponovo pozove Counter(), i tada useState vrati novu vrednost.
  // Analogija: konobar i kuhinja
  // Konobar (tvoj handler) zapisuje porudžbine na ceduljice. Kuhinja (React) ne kuva posle svake ceduljice, već kad konobar završi sa celim stolom, i sve odjednom.
  // 1. Scheduling: vrednost se ne menja odmah
  function handleSetCount(newCount) {
    setChosenCount((prevChosenCount) => prevChosenCount + 1);
    console.log(chosenCount); // wont't work
  }

  // components render in order, top to bottom; this also happens when App() re-renders
  // so we should avoid that and create encapsulation so only what must re-render does
  return (
    <>
      <Header />
      <main>
        <SetCounter onSet={handleSetCount} />
        <Counter initialCount={0} />
        {
          /* for learning how React state and position works with key */
          // using key={chosenCount} will enforce resetting component
          // key je React-ova etiketa identiteta. Kad se etiketa promeni, React smatra da je to druga komponenta: staru baca zajedno sa njenim stanjem i pravi novu od nule.
          // Šta React stvarno radi sa useState(initialCount)
          // React ne čuva stanje u funkciji Counter(), već u fioci vezanoj za mesto komponente u stablu. Fioku prepoznaje po tri stvari: tip komponente, pozicija i key.
          // Prvi render (mount, "rođenje" komponente): fioka ne postoji. React je napravi i u nju stavi initialCount.
          // Svaki sledeći render: fioka već postoji, pa React vrati ono što je u njoj. Argument initialCount potpuno ignoriše.
        }
        <CounterWithHistory key={chosenCount} initialCount={chosenCount} />
      </main>
    </>
  );
}
export default App;
