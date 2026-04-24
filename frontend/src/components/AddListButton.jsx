import { FiPlus } from "react-icons/fi";

/** Header “Add …” on list pages — plus icon + label */
export function AddListButton({ onClick, children }) {
  return (
    <button type="button" className="add-btn" onClick={onClick}>
      <FiPlus className="add-btn__icon" size={19} strokeWidth={2.5} aria-hidden />
      {children}
    </button>
  );
}
