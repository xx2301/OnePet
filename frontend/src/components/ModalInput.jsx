import { useState, useEffect } from "react";
// components/ModalInput.jsx
export default function ModalInput({ 
  isOpen, 
  title, 
  label, 
  defaultValue, 
  maxLength, 
  placeholder,
  onSubmit, 
  onCancel,
  disabled,
  submitText = "Submit"
}) {
  const [value, setValue] = useState(defaultValue || "");
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setValue(defaultValue || '');
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, defaultValue]);
  
  if (!isOpen) return null;
  
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    overflowY: 'auto'
  };

  const contentStyle = {
    backgroundColor: '#2a2a2a',
    padding: '30px',
    borderRadius: '12px',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
    position: 'relative',
    color: '#fff'
  };

  const titleStyle = {
    margin: '0 0 20px 0',
    fontSize: '24px',
    color: '#fff',
    textAlign: 'center'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '10px',
    fontSize: '16px',
    color: '#ccc'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    borderRadius: '6px',
    border: '1px solid #555',
    backgroundColor: '#1a1a1a',
    color: '#fff',
    boxSizing: 'border-box',
    marginBottom: '20px'
  };

  const actionsStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px'
  };

  const buttonStyle = {
    padding: '10px 24px',
    fontSize: '16px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.2s'
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#555',
    color: '#fff'
  };

  const submitButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#4CAF50',
    color: '#fff',
    opacity: (disabled || !value.trim()) ? 0.5 : 1,
    cursor: (disabled || !value.trim()) ? 'not-allowed' : 'pointer'
  };
  
  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={titleStyle}>{title}</h3>
        <label style={labelStyle}>{label}</label>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={disabled}
          style={inputStyle}
          autoFocus
        />
        <div style={actionsStyle}>
          <button onClick={onCancel} disabled={disabled} style={cancelButtonStyle}>
            Cancel
          </button>
          <button 
            onClick={() => onSubmit(value)} 
            disabled={disabled || !value.trim()}
            style={submitButtonStyle}
          >
            {submitText}
          </button>
        </div>
      </div>
    </div>
  );
}