import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000, // Port na kojem će raditi tvoj frontend
        proxy: {
            '/api': {
                target: 'http://localhost:8080', // Adresa tvog Spring Boot backend-a
                changeOrigin: true,
                secure: false,
            }
        }
    }
})
