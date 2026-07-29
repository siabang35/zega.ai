import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage, LANGUAGE_OPTIONS, Language } from '../../i18n/translations';

interface LanguageSelectorProps {
  compact?: boolean;
  dropUp?: boolean;
  align?: 'left' | 'right';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  compact = false, 
  dropUp = false,
  align = 'right' 
}) => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = LANGUAGE_OPTIONS.find(opt => opt.code === language) || LANGUAGE_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const positionClasses = dropUp 
    ? `bottom-full mb-1.5 ${align === 'left' ? 'left-0 origin-bottom-left' : 'right-0 origin-bottom-right'}`
    : `top-full mt-1.5 ${align === 'left' ? 'left-0 origin-top-left' : 'right-0 origin-top-right'}`;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer ${
          compact ? 'px-2 py-1 text-[11px]' : ''
        }`}
        aria-label="Select language"
      >
        <Globe size={13} className="text-slate-400 dark:text-slate-400" />
        <span className="font-sans font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">{currentOption.code}</span>
        <span className="hidden md:inline text-slate-500 font-normal text-[11px]">({currentOption.flag})</span>
        <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute ${positionClasses} w-48 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-none backdrop-blur-md z-[999999] animate-fadeIn`}>
          <div className="px-2.5 py-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider font-sans border-b border-slate-100 dark:border-slate-800/80 mb-1">
            Language / 语言 / Bahasa
          </div>
          <div className="space-y-0.5">
            {LANGUAGE_OPTIONS.map((option) => {
              const isSelected = option.code === language;
              return (
                <button
                  key={option.code}
                  onClick={() => {
                    setLanguage(option.code as Language);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-100 dark:bg-slate-800 text-[#e05638] font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm leading-none">{option.flag}</span>
                    <div className="text-left font-sans">
                      <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">{option.nativeName}</div>
                      <div className="text-[10px] text-slate-400 font-normal uppercase">{option.name}</div>
                    </div>
                  </div>
                  {isSelected && <Check size={13} className="text-[#e05638]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
