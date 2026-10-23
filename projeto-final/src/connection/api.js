import axios from 'axios';

// ===== API (AXIOS): ENDEREÇO DO BACKEND =====
// Todas as telas importam este arquivo para falar com o servidor.
// Cria uma configuração padrão para todas as requisições do aplicativo
const api = axios.create({
  // ==========================================
  // ATENÇÃO: COLOQUE AQUI O SEU IPV4 EXATO
  // ==========================================
  baseURL: 'http://192.168.1.22:3333', 
  timeout: 5000, // desiste depois de 5 segundos

});

export default api;