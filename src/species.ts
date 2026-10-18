import type { ImageSourcePropType } from 'react-native';

import type { SpeciesOption } from './models';

export const SPECIES_CATALOG: SpeciesOption[] = [
  {
    id: 'suculenta',
    label: 'Suculenta',
    defaultWaterDays: 10,
    defaultFertilizeDays: 45,
    tip: 'Prefere pouca água e muita luz.',
  },
  {
    id: 'samambaia',
    label: 'Samambaia',
    defaultWaterDays: 3,
    defaultFertilizeDays: 30,
    tip: 'Gosta de umidade e sombra clara.',
  },
  {
    id: 'cacto',
    label: 'Cacto',
    defaultWaterDays: 14,
    defaultFertilizeDays: 60,
    tip: 'Regue só quando o substrato secar bem.',
  },
  {
    id: 'rosa',
    label: 'Rosa',
    defaultWaterDays: 4,
    defaultFertilizeDays: 21,
    tip: 'Sol generoso e adubo regular.',
  },
  {
    id: 'girassol',
    label: 'Girassol',
    defaultWaterDays: 3,
    defaultFertilizeDays: 20,
    tip: 'Precisa de sol direto quase o dia todo.',
  },
  {
    id: 'campainha',
    label: 'Campainha',
    defaultWaterDays: 4,
    defaultFertilizeDays: 28,
    tip: 'Mantenha o solo levemente úmido.',
  },
  {
    id: 'tulipa',
    label: 'Tulipa',
    defaultWaterDays: 5,
    defaultFertilizeDays: 30,
    tip: 'Evite encharcar o bulbo.',
  },
  {
    id: 'roseiral',
    label: 'Roseiral',
    defaultWaterDays: 4,
    defaultFertilizeDays: 21,
    tip: 'Podas leves ajudam a floração.',
  },
  {
    id: 'arbusto',
    label: 'Arbusto',
    defaultWaterDays: 5,
    defaultFertilizeDays: 35,
    tip: 'Bom para varanda e meia-sombra.',
  },
  {
    id: 'carnivora',
    label: 'Carnívora',
    defaultWaterDays: 2,
    defaultFertilizeDays: 90,
    tip: 'Use água destilada ou de chuva.',
  },
  {
    id: 'cogumelo',
    label: 'Fungos / musgo',
    defaultWaterDays: 2,
    defaultFertilizeDays: 60,
    tip: 'Ambiente úmido e pouca luz direta.',
  },
  {
    id: 'broto',
    label: 'Muda / broto',
    defaultWaterDays: 3,
    defaultFertilizeDays: 40,
    tip: 'Comece com regas suaves e regulares.',
  },
];

const SPECIES_ART: Record<string, ImageSourcePropType> = {
  suculenta: require('./assets/plants/suculenta/suculenta_02.png'),
  samambaia: require('./assets/plants/samambaia/samambaia_02.png'),
  cacto: require('./assets/plants/cacto_flor/cacto_flor_02.png'),
  rosa: require('./assets/plants/rosa/rosa_01.png'),
  girassol: require('./assets/plants/girassol/girassol_03.png'),
  campainha: require('./assets/plants/campainha/campainha_02.png'),
  tulipa: require('./assets/plants/tulipa/tulipa_01.png'),
  roseiral: require('./assets/plants/roseiral/roseiral_02.png'),
  arbusto: require('./assets/plants/arbusto/arbusto_01.png'),
  carnivora: require('./assets/plants/carnivora/carnivora_01.png'),
  cogumelo: require('./assets/plants/cogumelo/cogumelo_02.png'),
  broto: require('./assets/plants/broto/broto_02.png'),
};

export const getSpecies = (id: string): SpeciesOption =>
  SPECIES_CATALOG.find((s) => s.id === id) ?? SPECIES_CATALOG[SPECIES_CATALOG.length - 1]!;

export const getSpeciesArt = (speciesId: string): ImageSourcePropType =>
  SPECIES_ART[speciesId] ?? SPECIES_ART.broto;
