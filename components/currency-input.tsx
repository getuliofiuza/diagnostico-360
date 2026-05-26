'use client';

import React from 'react';

/**
 * Formata número para padrão BR sem símbolo: 10.000.000,00
 */
function formatBRL(value: number | undefined | null): string {
  if (value == null || isNaN(value)) return '';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Converte string digitada -> número.
 * O usuário digita apenas dígitos; cada dígito vai sendo "puxado" para os centavos.
 * Ex: digita "1234567" -> retorna 12345.67
 */
function parseDigits(input: string): number | undefined {
  const digits = input.replace(/\D/g, '');
  if (!digits) return undefined;
  const cents = parseInt(digits, 10);
  return cents / 100;
}

interface CurrencyInputProps {
  value: number | undefined | null;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  className?: string;
  prefix?: string; // ex: "R$ "
}

/**
 * Input monetário no padrão brasileiro (10.000.000,00)
 * - Mostra valor formatado em tempo real
 * - Aceita apenas dígitos (cada dígito vira centavo)
 * - Backspace remove o último dígito
 */
export function CurrencyInput({
  value,
  onChange,
  placeholder = '0,00',
  className = '',
  prefix = '',
}: CurrencyInputProps) {
  const display = value != null ? formatBRL(value) : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = parseDigits(raw);
    onChange(parsed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permite Tab, Enter, setas, etc
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (allowedKeys.includes(e.key)) return;
    // Permite Ctrl/Cmd + A, C, V, X, Z
    if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase())) return;
    // Bloqueia qualquer coisa que não seja dígito
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`${prefix ? 'pl-10' : ''} ${className}`}
      />
    </div>
  );
}
