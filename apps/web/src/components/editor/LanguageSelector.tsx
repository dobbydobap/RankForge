'use client';

import { Language, LANGUAGE_DISPLAY } from '@rankforge/shared';

interface LanguageSelectorProps {
  value: string;
  onChange: (lang: string) => void;
}

const LANGUAGES = [
  Language.CPP,
  Language.C,
  Language.PYTHON,
  Language.JAVA,
  Language.JAVASCRIPT,
  Language.TYPESCRIPT,
  Language.GO,
  Language.RUST,
  Language.KOTLIN,
  Language.RUBY,
];

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-1.5 bg-rf-dark border border-rf-iron rounded-lg text-rf-pink text-sm focus:outline-none focus:ring-2 focus:ring-rf-sage"
    >
      {LANGUAGES.map((lang) => (
        <option key={lang} value={lang}>
          {LANGUAGE_DISPLAY[lang]}
        </option>
      ))}
    </select>
  );
}
