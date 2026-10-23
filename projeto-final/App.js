import 'react-native-gesture-handler';
import React, { useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import Rotas from './src/routes/rotas';
import { ProvedorTema, ContextoTema } from './src/contexts/ThemeContext';
import * as NavigationBar from 'expo-navigation-bar';

// ===== ESCONDER A BARRA DE NAVEGAÇÃO DO ANDROID =====
if (Platform.OS === 'android') {
  NavigationBar.setVisibilityAsync('hidden');
  NavigationBar.setBehaviorAsync('overlay-swipe'); 
}

// ===== COMPONENTE PRINCIPAL =====
// Lê o tema escuro do contexto e aplica na navegação.
function AppPrincipal() {
  const { tema_escuro } = useContext(ContextoTema);

  // ===== REESCONDER A BARRA DE NAVEGAÇÃO =====
  // Se ela aparecer, some de novo depois de 2 segundos.
  useEffect(() => {
    if (Platform.OS === 'android') {
      const listener = NavigationBar.addVisibilityListener(({ visibility }) => {
        if (visibility === 'visible') {
          setTimeout(() => {
            NavigationBar.setVisibilityAsync('hidden');
          }, 2000);
        }
      });
      return () => listener.remove();
    }
  }, []);

  // ===== NAVEGAÇÃO COM TEMA CLARO/ESCURO =====
  return (
    <NavigationContainer theme={tema_escuro ? DarkTheme : DefaultTheme}>
      <Rotas />
    </NavigationContainer>
  );
}

// ===== COMPONENTE RAIZ DO APP =====
// Envolve tudo no provedor do tema/estado global.
export default function App() {
  return (
    <ProvedorTema>
      <AppPrincipal />
    </ProvedorTema>
  );
}