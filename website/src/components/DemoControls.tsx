import type {Control, DemoDefinition, DemoSettings} from '../content/types';
import type {ReactElement} from 'react';

type DemoControlsProps = {
    demo: DemoDefinition;
    settings: DemoSettings;
    onChange: (settings: DemoSettings) => void;
};

export function DemoControls({demo, settings, onChange}: DemoControlsProps): ReactElement | null {
    if (demo.controls.length === 0) {
        return null;
    }

    function updateSetting(key: keyof DemoSettings, value: string | number): void {
        const currentValue = settings[key];
        onChange({
            ...settings,
            [key]: typeof currentValue === 'number' ? Number(value) : value,
        });
    }

    return (
        <div className="demo-controls">
            {demo.controls.map((control) => (
                <ControlField
                    control={control}
                    key={`${demo.id}-${control.key}`}
                    settings={settings}
                    onChange={updateSetting}
                />
            ))}
        </div>
    );
}

type ControlFieldProps = {
    control: Control;
    settings: DemoSettings;
    onChange: (key: keyof DemoSettings, value: string | number) => void;
};

function ControlField({control, settings, onChange}: ControlFieldProps): ReactElement {
    const value = settings[control.key];

    if (control.type === 'range') {
        const numericValue = typeof value === 'number' ? value : control.min;

        return (
            <label className="range-control">
                <span>
                    {control.label}
                    <strong>{numericValue}</strong>
                </span>
                <input
                    type="range"
                    min={control.min}
                    max={control.max}
                    step={control.step}
                    value={numericValue}
                    onChange={(event) => onChange(control.key, Number(event.target.value))}
                />
            </label>
        );
    }

    return (
        <div className="segmented-control" role="group" aria-label={control.label}>
            <span>{control.label}</span>
            <div>
                {control.options.map((option) => (
                    <button
                        className={value === option.value ? 'selected' : ''}
                        key={option.value}
                        type="button"
                        onClick={() => onChange(control.key, option.value)}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
