import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// ---------------------------------------------------------------------------
// Percorso base per GitHub Pages.
//
// GitHub Pages pubblica un repository di progetto (non uno "user/organization
// page") sotto https://<utente>.github.io/<nome-repo>/ — per questo il sito
// deve conoscere quel prefisso a build-time, altrimenti gli asset (JS, CSS,
// immagini) verrebbero richiesti dalla radice del dominio e non verrebbero
// trovati (schermata bianca dopo il deploy).
//
// PRIMA DI PUBBLICARE: imposta questo valore uguale al nome esatto del tuo
// repository GitHub, con gli slash iniziale e finale, es:
//   const BASE_PATH = '/casio-f91w-configurator/'
//
// Se invece pubblichi come "user/organization page" (repo chiamato
// <utente>.github.io), lascia BASE_PATH = '/'.
//
// In alternativa puoi impostare la variabile d'ambiente VITE_BASE_PATH in
// fase di build (vedi .github/workflows/deploy.yml) senza toccare questo file.
const BASE_PATH = '/'

export default defineConfig({
  base: BASE_PATH,
  plugins: [react(), tailwindcss()],
})
