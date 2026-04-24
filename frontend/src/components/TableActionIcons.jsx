import { FiCheckCircle, FiEdit2, FiTrash2, FiUserCheck, FiUserX } from "react-icons/fi";

export function IconEdit({ onClick, label }) {
  return (
    <button
      type="button"
      className="action-icon action-icon--edit"
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      <FiEdit2 size={18} strokeWidth={2.25} aria-hidden />
    </button>
  );
}

export function IconDelete({ onClick, label }) {
  return (
    <button
      type="button"
      className="action-icon action-icon--delete"
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      <FiTrash2 size={18} strokeWidth={2.25} aria-hidden />
    </button>
  );
}

/** isActive: current user/entity is active; shows deactivate action vs activate */
export function IconApprove({ onClick, label }) {
  return (
    <button
      type="button"
      className="action-icon action-icon--approve"
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      <FiCheckCircle size={18} strokeWidth={2.25} aria-hidden />
    </button>
  );
}

/** isActive: current user/entity is active; shows deactivate action vs activate */
export function IconUserToggle({ onClick, isActive, activateLabel, deactivateLabel }) {
  const label = isActive ? deactivateLabel : activateLabel;
  return (
    <button
      type="button"
      className="action-icon action-icon--toggle"
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      {isActive ? (
        <FiUserX size={18} strokeWidth={2.25} aria-hidden />
      ) : (
        <FiUserCheck size={18} strokeWidth={2.25} aria-hidden />
      )}
    </button>
  );
}
