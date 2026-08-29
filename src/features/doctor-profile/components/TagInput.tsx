import { useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

/** Chip-style editor for the JSON list fields (languages, subspecialties). */
export default function TagInput({
    value, onChange, placeholder, id, maxItems = 20,
}: {
    value: string[];
    onChange: (next: string[]) => void;
    placeholder?: string;
    id?: string;
    maxItems?: number;
}) {
    const { t } = useTranslation();
    const [draft, setDraft] = useState('');

    function commit() {
        const item = draft.trim();
        if (!item) return;
        // De-duplicate case-insensitively, matching the backend's validator.
        if (value.some(v => v.toLowerCase() === item.toLowerCase())) { setDraft(''); return; }
        if (value.length >= maxItems) return;
        onChange([...value, item]);
        setDraft('');
    }

    function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit();
        } else if (e.key === 'Backspace' && !draft && value.length) {
            onChange(value.slice(0, -1));
        }
    }

    return (
        <div className="taginput">
            <div className="taginput__chips">
                {value.map(item => (
                    <span key={item} className="taginput__chip">
                        {item}
                        <button
                            type="button"
                            className="taginput__remove"
                            onClick={() => onChange(value.filter(v => v !== item))}
                            aria-label={t('doctorProfile.removeItem', { item })}
                        >
                            ×
                        </button>
                    </span>
                ))}
            </div>
            <input
                id={id}
                type="text"
                className="input"
                value={draft}
                placeholder={placeholder}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                onBlur={commit}
            />
        </div>
    );
}
