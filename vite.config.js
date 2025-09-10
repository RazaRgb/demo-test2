import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  //base:'/demo-test/test1/dist',
  plugins: [react()],
  server: {
    watch:{
      usePolling:true
    },
    hmr:{
      overlay:false,
      clientPort:5173
    }
  }
});
