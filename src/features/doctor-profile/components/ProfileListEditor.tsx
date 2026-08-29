import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';

import { toast, parseApiError, Dialog } from '../../../shared/components/ui';

export interface EditorField {
    name: string;
    label: string;
    type?: 'text' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox';
    options?: { value: string; label: string }[];
    placeholder?: string;
    half?: boolean;
}

interface Row { id: number }

/**
 * Add / edit / delete for the four profile lists.
 *
 * One editor rather than four near-identical ones: the caller supplies the
 * field definitions, a one-line summary renderer, and the three service calls.
 */
export default function ProfileListEditor<T extends Row>({
    title, items, fields, emptyText, addLabel, queryKey, summary,
    onCreate, onUpdate, onDelete, isLoading, blank,
}: {
    title: string;
    items: T[];
    fields: EditorField[];
    emptyText: string;
    addLabel: string;
    queryKey: QueryKey;
    summary: (item: T) => ReactNode;
    onCreate: (d: Partial<T>) => Promise<unknown>;
    onUpdate: (id: number, d: Partial<T>) => Promise<unknown>;
    onDelete: (id: number) => Promise<unknown>;
    isLoading?: boolean;
    blank: Partial<T>;
}) {
    const { t } = useTranslation();
    const qc = useQueryClient();
    const [draft, setDraft] = useState<Partial<T> | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<T | null>(null);

    const invalidate = () => {
        qc.invalidateQueries({ queryKey });
        // The completeness meter depends on these lists.
        qc.invalidateQueries({ queryKey: ['doctor-profile', 'completeness'] });
    };

    const save = useMutation({
        mutationFn: (d: Partial<T>) =>
            (d as Row).id ? onUpdate((d as Row).id, d) : onCreate(d),
        onSuccess: () => { toast.success(t('doctorProfile.saved')); setDraft(null); invalidate(); },
        onError: (err) => toast.error(parseApiError(err, t('doctorProfile.saveError'))),
    });

    const remove = useMutation({
        mutationFn: (id: number) => onDelete(id),
        onSuccess: () => { toast.success(t('doctorProfile.deleted')); setConfirmDelete(null); invalidate(); },
        onError: (err) => toast.error(parseApiError(err, t('doctorProfile.deleteError'))),
    });

    function setField(name: string, value: unknown) {
        setDraft(d => ({ ...(d ?? {}), [name]: value }) as Partial<T>);
    }

    return (
        <div className="proflist">
            <div className="proflist__head">
                <h3 className="proflist__title">{title}</h3>
                {!draft && (
                    <button type="button" className="btn btn-secondary btn-sm"
                            onClick={() => setDraft({ ...blank })}>
                        + {addLabel}
                    </button>
                )}
            </div>

            {isLoading && <p className="proflist__empty">{t('common.loading')}</p>}

            {!isLoading && items.length === 0 && !draft && (
                <p className="proflist__empty">{emptyText}</p>
            )}

            {items.length > 0 && (
                <ul className="proflist__items">
                    {items.map(item => (
                        <li key={item.id} className="proflist__item">
                            <div className="proflist__item-body">{summary(item)}</div>
                            <div className="proflist__item-actions">
                                <button type="button" className="btn btn-secondary btn-xs"
                                        onClick={() => setDraft({ ...item })}>
                                    {t('common.edit')}
                                </button>
                                <button type="button" className="btn btn-danger btn-xs"
                                        onClick={() => setConfirmDelete(item)}>
                                    {t('common.delete')}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {draft && (
                <div className="proflist__form">
                    <div className="proflist__grid">
                        {fields.map(f => {
                            const value = (draft as Record<string, unknown>)[f.name];
                            const inputId = `${String(queryKey[1] ?? 'field')}-${f.name}`;
                            return (
                                <div key={f.name}
                                     className={`form-group${f.half ? ' proflist__half' : ''}`}>
                                    {f.type !== 'checkbox' && <label htmlFor={inputId}>{f.label}</label>}
                                    {f.type === 'textarea' ? (
                                        <textarea id={inputId} className="input" rows={3}
                                                  placeholder={f.placeholder}
                                                  value={(value as string) ?? ''}
                                                  onChange={e => setField(f.name, e.target.value)} />
                                    ) : f.type === 'select' ? (
                                        <select id={inputId} className="input select-input"
                                                value={(value as string) ?? ''}
                                                onChange={e => setField(f.name, e.target.value)}>
                                            {f.options?.map(o => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                    ) : f.type === 'checkbox' ? (
                                        <label className="proflist__check" htmlFor={inputId}>
                                            <input id={inputId} type="checkbox"
                                                   checked={Boolean(value)}
                                                   onChange={e => setField(f.name, e.target.checked)} />
                                            {f.label}
                                        </label>
                                    ) : (
                                        <input id={inputId} type={f.type ?? 'text'} className="input"
                                               placeholder={f.placeholder}
                                               value={(value as string | number) ?? ''}
                                               onChange={e => setField(
                                                   f.name,
                                                   f.type === 'number'
                                                       ? (e.target.value === '' ? null : Number(e.target.value))
                                                       : e.target.value,
                                               )} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="proflist__form-actions">
                        <button type="button" className="btn btn-secondary btn-sm"
                                onClick={() => setDraft(null)}>
                            {t('common.cancel')}
                        </button>
                        <button type="button" className="btn btn-primary btn-sm"
                                disabled={save.isPending}
                                onClick={() => save.mutate(draft)}>
                            {save.isPending ? t('common.saving') : t('common.save')}
                        </button>
                    </div>
                </div>
            )}

            <Dialog
                open={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={() => { if (confirmDelete) remove.mutate(confirmDelete.id); }}
                title={t('doctorProfile.confirmDeleteTitle')}
                message={t('doctorProfile.confirmDeleteBody')}
                confirmLabel={t('common.delete')}
                tone="danger"
            />
        </div>
    );
}
