import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ContextoTema } from '../../contexts/ThemeContext';
import BotaoPadrao from '../../components/Botao';
import api from '../../connection/api';

// ===== TELA: ENVIAR SUGESTÃO =====
export default function Feedback() {
  const navegacao = useNavigation();
  const { tema_escuro, logado, id_usuario } = useContext(ContextoTema);

  // ===== CAMPOS DO FORMULÁRIO =====
  // comentario = texto digitado 
  //  enviando = evita enviar duas vezes.
  const [comentario, set_comentario] = useState('');
  const [enviando, set_enviando] = useState(false);

  // ===== CORES DO TEMA =====
  const fundo = tema_escuro ? '#121212' : '#F0F8FF';
  const cor_texto = tema_escuro ? '#FFFFFF' : '#333333';
  const cor_titulo = tema_escuro ? '#93C5FD' : '#1E1B8D';
  const fundo_entrada = tema_escuro ? '#1E1E1E' : '#FFFFFF';
  const cor_borda = tema_escuro ? '#333333' : '#E5E7EB';
  const cor_botao = '#2563EB';

  // ===== ENVIAR SUGESTÃO AO SERVIDOR (POST /sugestoes) =====
  // Quem não fez login envia como Anônimo.
  const enviar = async () => {
    if (comentario.trim() === '') {
      alert('Por favor, escreva algo antes de enviar.');
      return;
    }
    if (enviando) return;

    set_enviando(true);
    try {
      await api.post('/sugestoes', {
        // quem não fez login envia como "Anônimo"
        id_usuario: logado ? id_usuario : null,
        mensagem: comentario.trim(),
      });
      alert('Feedback enviado com sucesso! Muito obrigado.');
      set_comentario('');
      navegacao.goBack();
    } catch (erro) {
      alert(
        erro.response?.data?.erro ||
          'Não foi possível enviar. Verifique a conexão e tente de novo.'
      );
    } finally {
      set_enviando(false);
    }
  };

  // ===== VISUAL DA TELA (JSX) =====
  return (
    <SafeAreaView style={[estilos.container, { backgroundColor: fundo }]}>
      {/* TECLADO NÃO COBRE O CAMPO */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        {/* FECHAR O TECLADO AO TOCAR FORA */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={estilos.interno}>
            {/* CABEÇALHO COM BOTÃO VOLTAR */}
            <View style={estilos.cabecalho}>
              <TouchableOpacity
                onPress={() => navegacao.goBack()}
                style={estilos.botao_voltar}>
                <Ionicons name="arrow-back" size={28} color={cor_titulo} />
              </TouchableOpacity>
              <Text style={[estilos.titulo_cabecalho, { color: cor_titulo }]}>
                Enviar sugestão
              </Text>
              <View style={{ width: 28 }} />
            </View>

            {/* IMAGEM ILUSTRATIVA */}
            <View style={estilos.container_imagem}>
              <Image
                source={{
                  uri: 'https://cdn3d.iconscout.com/3d/premium/thumb/feedback-5858066-4897217.png',
                }}
                style={estilos.ilustracao}
                resizeMode="contain"
              />
            </View>

            {/* TÍTULO */}
            <Text style={[estilos.titulo, { color: cor_texto }]}>
              Como podemos ajudar?
            </Text>

            {/* CAIXA DE TEXTO DA SUGESTÃO */}
            <View
              style={[
                estilos.envolvedor_entrada,
                { backgroundColor: fundo_entrada, borderColor: cor_borda },
              ]}>
              <TextInput
                style={[estilos.entrada, { color: cor_texto }]}
                placeholder="Escreva aqui sua sugestão"
                placeholderTextColor={tema_escuro ? '#9CA3AF' : '#A0AEC0'}
                multiline={true}
                maxLength={500}
                value={comentario}
                onChangeText={set_comentario}
                textAlignVertical="top"
              />
            </View>

            {/* BOTÃO ENVIAR */}
            <BotaoPadrao
              texto={enviando ? 'Enviando...' : 'Enviar Sugestão'}
              ao_pressionar={enviar}
            />
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ===== ESTILOS DA TELA =====
const estilos = StyleSheet.create({
  container: {
    flex: 1,
  },
  interno: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 10,
  },
  botao_voltar: {
    padding: 5,
  },
  titulo_cabecalho: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  container_imagem: {
    alignItems: 'center',
    marginVertical: 20,
  },
  ilustracao: {
    width: 200,
    height: 150,
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  envolvedor_entrada: {
    borderWidth: 1,
    borderRadius: 15,
    height: 150,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  entrada: {
    flex: 1,
    fontSize: 16,
  },
});   