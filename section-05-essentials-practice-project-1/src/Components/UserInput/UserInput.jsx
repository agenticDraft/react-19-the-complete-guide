
export default function UserInput({userInput, handleChange}) {
  return (
    <section id="user-input">
      <div className="input-group">
        <p>
          <label>Initial Investment ($)</label>
          <input
            type="number"
            required
            value={userInput.initialInvestment}
            onChange={(e) => handleChange('initialInvestment', e.target.value)} />
        </p>
      </div>
      <div className="input-group">
        <p>
          <label>Annual Investment ($)</label>
          <input
            type="number"
            required
            value={userInput.annualInvestment}
            onChange={(e) => handleChange('annualInvestment', e.target.value)} />
        </p>
      </div>
      <div className="input-group">
        <p>
          <label>Expected return</label>
          <input
            type="number"
            required
            value={userInput.expectedReturn}
            onChange={(e) => handleChange('expectedReturn', e.target.value)} />
        </p>
      </div>
      <div className="input-group">
        <p>
          <label>Duration</label>
          <input
            type="number"
            required
            value={userInput.duration}
            onChange={(e) => handleChange('duration', e.target.value)} />
        </p>
      </div>
    </section>
  );
}
