type QualityMenuProps = {
  reflections: boolean;
  disabled?: boolean;
  onReflectionsChange: (value: boolean) => void;
};

const Toggle = ({
  label,
  pressed,
  disabled,
  onChange,
}: {
  label: string;
  pressed: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) => {
  return (
    <button
      type="button"
      className={`quality-menu__toggle${pressed ? " is-on" : ""}`}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={() => onChange(!pressed)}
    >
      <span className="quality-menu__dot" aria-hidden="true" />
      {label}
    </button>
  );
};

export const QualityMenu = ({ reflections, disabled, onReflectionsChange }: QualityMenuProps) => {
  return (
    <div className="quality-menu">
      <Toggle label="Reflections" pressed={reflections} disabled={disabled} onChange={onReflectionsChange} />
    </div>
  );
};
