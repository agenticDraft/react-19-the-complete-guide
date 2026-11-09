import "./CoreConcept.css";

export default function CoreConcept({ title, description, image }) {
  return (
    <li>
      <h2>{title}</h2>
      <p>{description}</p>
      <img src={image} alt={title} />
    </li>
  );
}