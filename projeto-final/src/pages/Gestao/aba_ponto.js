import React, { useContext, useState } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// IMPORTAMOS O SEU FICHEIRO DE CONEXÃO AQUI
import api from '../../connection/api';
import { ContextoTema } from '../../contexts/ThemeContext';

import CabecalhoVoltar from '../../components/Cabecalho';
import EntradaTexto from '../../components/CaixaTexto';
import BotaoPadrao from '../../components/Botao';

// ===== TELA: NOVO PONTO (SÓ ADM) =====
export default function Ponto() {
  const navegacao = useNavigation();
  const { tema_escuro } = useContext(ContextoTema);
  const fundo = tema_escuro ? '#121212' : '#F4F7FB';

  // ===== CAMPOS DO FORMULÁRIO =====
  const [nome, set_nome] = useState('');
  const [latitude, set_latitude] = useState('');
  const [longitude, set_longitude] = useState('');

  // ===== SALVAR PONTO NO SERVIDOR (POST /pontos) =====
  const salvar_ponto = async () => {
    if (!nome || !latitude || !longitude) {
      Alert.alert('Aviso', 'Preencha todos os campos obrigatórios.');
      return;
    }

    const lat = parseFloat(latitude.replace(',', '.'));
    const lng = parseFloat(longitude.replace(',', '.'));

    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Erro', 'Latitude e Longitude devem ser numéricos.');
      return;
    }

    const dados_ponto = {
      nome_ponto: nome,
      latitude_ponto: lat,
      longitude_ponto: lng,
    };

    try {
      // USAMOS A VARIÁVEL 'api' EM VEZ DE 'axios'
      await api.post('/pontos', dados_ponto);

      Alert.alert('Sucesso', 'Ponto adicionado diretamente no Banco de Dados!');
      navegacao.navigate('Home');
    } catch (erro) {
      console.error(erro);
      Alert.alert(
        'Erro',
        'Não foi possível salvar. Verifique se a API está a correr.'
      );
    }
  };

  // ===== ESTRUTURA DA TELA =====
  return (
    <SafeAreaView style={[estilos.container, { backgroundColor: fundo }]}>
      {/* CABEÇALHO */}
      <CabecalhoVoltar titulo="Novo Ponto" />
      {/* FORMULÁRIO */}
      <ScrollView
        contentContainerStyle={estilos.formulario}
        keyboardShouldPersistTaps="handled">
        {/* CAMPO: NOME */}
        <EntradaTexto
          rotulo="Nome: "
          valor={nome}
          ao_mudar={set_nome}
        />
        {/* CAMPO: LATITUDE */}
        <EntradaTexto
          rotulo="Latitude: "
          valor={latitude}
          ao_mudar={set_latitude}
        />
        {/* CAMPO: LONGITUDE */}
        <EntradaTexto
          rotulo="Longitude: "
          valor={longitude}
          ao_mudar={set_longitude}
        />
        {/* BOTÃO SALVAR */}
        <View style={{ marginTop: 20 }}>
          <BotaoPadrao texto="Adicionar no Mapa" ao_pressionar={salvar_ponto} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ===== ESTILOS DA TELA =====
const estilos = StyleSheet.create({
  container: { flex: 1 },
  formulario: { padding: 20, paddingTop: 30 },
});
