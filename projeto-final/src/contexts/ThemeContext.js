import React, { createContext, useState } from 'react';

// ===== CONTEXTO GLOBAL DO APP =====
// Guarda tema, login e dados compartilhados entre todas as telas.
export const ContextoTema = createContext({});

// ===== PROVEDOR DO ESTADO GLOBAL =====
export function ProvedorTema({ children }) {
  // ===== TEMA, LOGIN E TIPO DE USUÁRIO (ADM) =====
  const [tema_escuro, set_tema_escuro] = useState(false);
  const [logado, set_logado] = useState(false);
  const [adm, set_adm] = useState(false);
  
  // ===== DADOS DO USUÁRIO LOGADO =====
  const [id_usuario, set_id_usuario] = useState(null);
  // dados do perfil do usuário logado: { id_usuario, nome, email, foto }
  const [usuario, set_usuario] = useState(null);
  // ===== FAVORITOS GLOBAIS =====
  const [favoritos_globais, set_favoritos_globais] = useState([]);
  
  // ===== ROTAS E PONTOS GLOBAIS =====
  // Carregados do servidor pela tela Home.
  const [rotas_globais, set_rotas_globais] = useState([]);
  const [pontos_globais, set_pontos_globais] = useState([]);

  // ===== VALORES COMPARTILHADOS COM TODO O APP =====
  return (
    <ContextoTema.Provider
      value={{
        tema_escuro,
        set_tema_escuro,
        logado,
        set_logado,
        adm,
        set_adm,
        id_usuario,
        set_id_usuario,
        usuario,
        set_usuario,
        favoritos_globais,
        set_favoritos_globais,
        rotas_globais,
        set_rotas_globais,
        pontos_globais,
        set_pontos_globais
      }}
    >
      {children}
    </ContextoTema.Provider>
  );
}