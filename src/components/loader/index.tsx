export const Loader = ({ ready }: { ready: boolean }) => {
  return (
    <div className={`loader ${ready ? "loader--done" : ""}`} aria-hidden={ready}>
      <div className="loader__label">LOADING</div>
      <div className="loader__track">
        <div className="loader__fill" />
      </div>
    </div>
  );
};
