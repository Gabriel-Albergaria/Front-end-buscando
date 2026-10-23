import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

// ===== COMPONENTE: BOTÃO PADRÃO =====
// Props: texto e ao_pressionar.
export default function BotaoPadrao({ texto, ao_pressionar }) {
  return (
    <TouchableOpacity style={estilos.botao} onPress={ao_pressionar}>
      <Text style={estilos.texto_botao}>{texto}</Text>
    </TouchableOpacity>
  );
}

// ===== ESTILOS DO BOTÃO =====
const estilos = StyleSheet.create({
  botao: {
    backgroundColor: '#2563EB',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  texto_botao: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
