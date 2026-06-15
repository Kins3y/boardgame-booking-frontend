import { useState } from "react";
import "./PasswordInput.css";

type PasswordInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  preventClipboard?: boolean;
};

export default function PasswordInput({
  value,
  onChange,
  placeholder = "Enter password",
  autoComplete = "current-password",
  preventClipboard = false
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  function preventClipboardAction(event: React.ClipboardEvent<HTMLInputElement>) {
    if (preventClipboard) {
      event.preventDefault();
    }
  }

  function preventContextMenu(event: React.MouseEvent<HTMLInputElement>) {
    if (preventClipboard) {
      event.preventDefault();
    }
  }

  return (
    <div className="password-input-wrapper">
      <input
        type={isVisible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onCopy={preventClipboardAction}
        onCut={preventClipboardAction}
        onPaste={preventClipboardAction}
        onContextMenu={preventContextMenu}
      />

      <button
        type="button"
        className="password-visibility-button"
        onClick={() => setIsVisible((currentValue) => !currentValue)}
        aria-label={isVisible ? "Hide password" : "Show password"}
      >
        {isVisible ? "🙈" : "👁️"}
      </button>
    </div>
  );
}