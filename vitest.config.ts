import { defineConfig } from 'vitest/config'

/**
 * Configurazione dei test, separata da `vite.config.ts` di proposito: i test
 * girano su funzioni pure (motore prezzi, aree di ritaglio, link di
 * configurazione) e non hanno bisogno di React, Tailwind né del plugin che
 * genera le pagine statiche — tenerli fuori li rende più veloci e toglie di
 * mezzo possibili interferenze.
 *
 * Comandi:
 *   npm test        una passata sola (quello che gira anche in CI)
 *   npm run test:watch   riesegue i test a ogni salvataggio
 */
export default defineConfig({
  test: {
    // Nessun DOM necessario: le funzioni sotto test non toccano la pagina.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
