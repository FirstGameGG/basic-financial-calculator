const BASE_SPACING_UNIT = 8;
const MAX_PRESET_STEP = 24;

export type SpacingStep =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24;

export const spacing = (step: SpacingStep): string => `${step * BASE_SPACING_UNIT}px`;

export const spacingScale: Readonly<Record<SpacingStep, string>> = Object.freeze(
  Object.fromEntries(
    Array.from({ length: MAX_PRESET_STEP + 1 }, (_, step) => [step as SpacingStep, spacing(step as SpacingStep)])
  ) as Record<SpacingStep, string>
);

export const spacingUnit = BASE_SPACING_UNIT;
