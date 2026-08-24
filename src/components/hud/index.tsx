export const Hud = () => {
  return (
    <div className="hud">
      <div className="logo">JSON OVER NETWORK</div>
      <div className="description">3D VISUALIZATION OF JSON TRANSFERING PROCESS</div>
      <ul className="legend">
        <li className="legend__item">
          <span className="legend__icon legend__icon--green" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M16 3.5 L28 10.5 L28 21.5 L16 28.5 L4 21.5 L4 10.5 Z" />
              <path d="M4 10.5 L16 17.5 L28 10.5" />
              <path d="M16 17.5 L16 28.5" />
            </svg>
          </span>
          <span>JSON OBJECT</span>
        </li>
        <li className="legend__item">
          <span className="legend__icon legend__icon--blue" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M16 3.5 L28 10.5 L28 21.5 L16 28.5 L4 21.5 L4 10.5 Z" />
              <path d="M4 10.5 L16 17.5 L28 10.5" />
              <path d="M16 17.5 L16 28.5" />
            </svg>
          </span>
          <span>NETWORK PACKET</span>
        </li>
        <li className="legend__item">
          <span className="legend__icon legend__icon--purple" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M6 10 H26" />
              <path d="M3 16 H29" />
              <path d="M6 22 H26" />
            </svg>
          </span>
          <span>DATA STREAM</span>
        </li>
      </ul>
    </div>
  );
};
