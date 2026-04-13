import React, { useRef, useState } from 'react';

const toDraft = (value) => {
  if (value === null || value === undefined) return '';
  return String(value);
};

const digitsOnly = (value) => String(value ?? '').replace(/\D/g, '');

export default function NumericInput({
  value,
  onValueChange,
  min,
  max,
  maxLength,
  fallbackValue = '',
  selectOnFocus = true,
  preserveLeadingZeros = false,
  inputStyle,
  ...rest
}) {
  const [draft, setDraft] = useState(toDraft(value));
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const shouldReselectRef = useRef(false);

  const editableDraft = (raw) => {
    let next = digitsOnly(raw).slice(0, typeof maxLength === 'number' ? maxLength : undefined);

    if (!preserveLeadingZeros && next.length > 1) {
      next = String(Number.parseInt(next, 10) || 0);
    }

    return next;
  };

  const selectContents = () => {
    const input = inputRef.current;
    if (!input) return;

    try {
      input.select();
      if (typeof input.setSelectionRange === 'function') {
        input.setSelectionRange(0, input.value.length);
      }
    } catch {
      // Ignore selection errors on unsupported mobile browsers.
    }
  };

  const normalize = (raw, useFallback = false) => {
    const digits = digitsOnly(raw).slice(0, typeof maxLength === 'number' ? maxLength : undefined);

    if (!digits) {
      return useFallback ? toDraft(fallbackValue) : '';
    }

    if (preserveLeadingZeros) {
      return digits;
    }

    let next = Number.parseInt(digits, 10);
    if (Number.isNaN(next)) {
      return useFallback ? toDraft(fallbackValue) : '';
    }

    if (typeof min === 'number') next = Math.max(min, next);
    if (typeof max === 'number') next = Math.min(max, next);

    return String(next);
  };

  const handleChange = (event) => {
    shouldReselectRef.current = false;
    const next = editableDraft(event.target.value);
    setDraft(next);
    onValueChange?.(next);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setDraft(toDraft(value));

    if (!selectOnFocus) return;

    shouldReselectRef.current = true;
    requestAnimationFrame(selectContents);
  };

  const handlePointerUp = () => {
    if (!shouldReselectRef.current || !selectOnFocus) return;

    requestAnimationFrame(() => {
      selectContents();
      shouldReselectRef.current = false;
    });
  };

  const handleBlur = () => {
    const normalized = normalize(draft, true);
    shouldReselectRef.current = false;
    setIsFocused(false);
    setDraft(normalized);
    onValueChange?.(normalized);
  };

  return (
    <input
      {...rest}
      ref={inputRef}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      enterKeyHint="done"
      value={isFocused ? draft : toDraft(value)}
      onChange={handleChange}
      onFocus={handleFocus}
      onPointerUp={handlePointerUp}
      onBlur={handleBlur}
      style={inputStyle}
    />
  );
}
