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
      className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
    >
      {LANGUAGES.map((lang) => (
        <option key={lang} value={lang}>
          {LANGUAGE_DISPLAY[lang]}
        </option>
      ))}
    </select>
  );
}
