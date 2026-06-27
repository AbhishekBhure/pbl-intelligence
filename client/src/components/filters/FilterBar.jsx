const FilterBar = ({ filters, options, onChange, loading }) => {
    const selectStyle = (hasValue) => ({
        ...styles.select,
        borderColor: hasValue ? '#4f46e5' : '#e5e7eb',
        color: hasValue ? '#4f46e5' : '#374151',
        fontWeight: hasValue ? '600' : '400',
    });

    return (
        <div style={styles.wrapper}>
            <div style={styles.label}>Filters</div>
            <div style={styles.row}>

                {/* Month */}
                <div style={styles.group}>
                    <label style={styles.fieldLabel}>Month</label>
                    <select
                        style={selectStyle(!!filters.month)}
                        value={filters.month || ''}
                        onChange={(e) => onChange('month', e.target.value || null)}
                        disabled={loading}
                    >
                        <option value="">All Months</option>
                        {options.months?.map((m) => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>

                {/* District */}
                <div style={styles.group}>
                    <label style={styles.fieldLabel}>District</label>
                    <select
                        style={selectStyle(!!filters.district)}
                        value={filters.district || ''}
                        onChange={(e) => onChange('district', e.target.value || null)}
                        disabled={loading}
                    >
                        <option value="">All Districts</option>
                        {options.districts?.map((d) => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>

                {/* Block */}
                <div style={styles.group}>
                    <label style={styles.fieldLabel}>Block</label>
                    <select
                        style={selectStyle(!!filters.block)}
                        value={filters.block || ''}
                        onChange={(e) => onChange('block', e.target.value || null)}
                        disabled={loading}
                    >
                        <option value="">All Blocks</option>
                        {options.blocks?.map((b) => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                </div>

                {/* Grade */}
                <div style={styles.group}>
                    <label style={styles.fieldLabel}>Grade</label>
                    <select
                        style={selectStyle(!!filters.grade)}
                        value={filters.grade || ''}
                        onChange={(e) => onChange('grade', e.target.value || null)}
                        disabled={loading}
                    >
                        <option value="">All Grades</option>
                        {options.grades?.map((g) => (
                            <option key={g} value={g}>Class {g}</option>
                        ))}
                    </select>
                </div>

                {/* Subject */}
                <div style={styles.group}>
                    <label style={styles.fieldLabel}>Subject</label>
                    <select
                        style={selectStyle(!!filters.subject)}
                        value={filters.subject || ''}
                        onChange={(e) => onChange('subject', e.target.value || null)}
                        disabled={loading}
                    >
                        <option value="">All Subjects</option>
                        {options.subjects?.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                {/* Clear */}
                {Object.values(filters).some(Boolean) && (
                    <div style={styles.group}>
                        <label style={styles.fieldLabel}>&nbsp;</label>
                        <button
                            style={styles.clearBtn}
                            onClick={() => onChange('__clear__', null)}
                            disabled={loading}
                        >
                            ✕ Clear
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

const styles = {
    wrapper: {
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '24px',
    },
    label: {
        fontSize: '11px',
        fontWeight: '700',
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: '12px',
    },
    row: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'flex-end',
    },
    group: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        minWidth: '150px',
    },
    fieldLabel: {
        fontSize: '11px',
        fontWeight: '600',
        color: '#6b7280',
    },
    select: {
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1.5px solid #e5e7eb',
        backgroundColor: '#fff',
        fontSize: '13px',
        cursor: 'pointer',
        transition: 'border-color 0.15s ease',
    },
    clearBtn: {
        padding: '8px 16px',
        borderRadius: '8px',
        backgroundColor: '#f3f4f6',
        color: '#6b7280',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        border: '1.5px solid #e5e7eb',
    },
};

export default FilterBar;