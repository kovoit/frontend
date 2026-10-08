// Charte Nana Tech (maquettes docs/Nana Tech.zip) — source unique des couleurs.
// Ne pas utiliser de valeurs hex dans les composants : passer par les classes Tailwind générées.

export const colors = {
  brand: {
    50: '#EFF3F9',
    100: '#DFE6F1',
    200: '#BFCDE3',
    300: '#93A9CF',
    400: '#6585BA',
    500: '#3D63A0',
    600: '#2A4D85',
    700: '#1B3A6B',
    800: '#14315F',
    900: '#0F2A55',
  },
  accent: {
    50: '#FFF3E6',
    100: '#FFE2C2',
    200: '#FCC88E',
    300: '#F9AE5C',
    400: '#F59B3D',
    500: '#F28C28',
    600: '#D9731A',
    700: '#B35A12',
  },
  success: { 50: '#E8F7EE', 100: '#C9EDD7', 500: '#22A55B', 600: '#1B8A4B', 700: '#15703D' },
  danger: { 50: '#FDECEC', 100: '#F9D0D1', 500: '#E5484D', 600: '#C9363B', 700: '#A3272C' },
  // Fonds sombres hérités d'Horizon (mode sombre)
  navy: { 700: '#1B254B', 800: '#111C44', 900: '#0B1437' },
  bg: '#F5F7FA',
  surface: '#FFFFFF',
  line: '#E6EAF0',
  muted: '#6B7A90',
} as const
