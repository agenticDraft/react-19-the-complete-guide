import CoreConcept from "../CoreConcept/CoreConcept.jsx";
import { CORE_CONCEPTS_ARRAY } from "../../data.js";

export default function CoreConcepts() {
  return (
    <section id="core-concepts">
      <h2>Core Concepts</h2>
      <ul>
        {CORE_CONCEPTS_ARRAY.map((conceptItem) => (
          <CoreConcept key={conceptItem.title} {...conceptItem} />
        ))}
      </ul>
    </section>
  );
}
