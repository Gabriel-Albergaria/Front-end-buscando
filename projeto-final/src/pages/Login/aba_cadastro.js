import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ContextoTema } from '../../contexts/ThemeContext';
import api from '../../connection/api'; // Importação da API

// ===== TELA: CADASTRO =====
export default function Cadastro() {
  const navegacao = useNavigation();
  const { tema_escuro } = useContext(ContextoTema);

  // ===== CAMPOS DO FORMULÁRIO =====
  const [nome, set_nome] = useState('');
  const [email, set_email] = useState('');
  const [senha, set_senha] = useState('');
  const [confirmar_senha, set_confirmar_senha] = useState('');

  // ===== CORES DO TEMA =====
  const fundo = tema_escuro ? '#121212' : '#F0F8FF';
  const cor_texto = tema_escuro ? '#FFFFFF' : '#333333';
  const fundo_entrada = tema_escuro ? '#1E1E1E' : '#FFFFFF';
  const cor_texto_fundo = '#9CA3AF';
  const azul_principal = '#2563EB';

  // ===== FAZER CADASTRO (POST /usuarios) =====
  // Valida os campos e se as senhas são iguais, depois envia ao servidor.
  const fazer_cadastro = async () => {
    if (!nome || !email || !senha || !confirmar_senha) {
      Alert.alert('Atenção', 'Preencha todos os campos para se cadastrar!');
      return;
    }
    if (senha !== confirmar_senha) {
      Alert.alert('Atenção', 'As senhas não coincidem. Tente novamente!');
      return;
    }

    try {
      // Envia os dados para salvar na base de dados
      await api.post('/usuarios', {
        nome: nome,
        email: email.toLowerCase(),
        senha: senha,
      });

      Alert.alert(
        'Sucesso',
        'Conta criada com sucesso! Faça login para continuar.'
      );
      set_nome('');
      set_email('');
      set_senha('');
      set_confirmar_senha('');
      navegacao.goBack();
    } catch (erro) {
      // Se o email já existir, o backend avisa e nós mostramos aqui
      if (erro.response && erro.response.data && erro.response.data.erro) {
        Alert.alert('Erro', erro.response.data.erro);
      } else {
        Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
        console.error(erro);
      }
    }
  };

  // ===== VISUAL DA TELA (JSX) =====
  return (
    <SafeAreaView style={[estilos.container, { backgroundColor: fundo }]}>
      {/* TECLADO NÃO COBRE OS CAMPOS */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        {/* ROLAGEM DA TELA */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}>
          {/* BOTÃO VOLTAR */}
          <TouchableOpacity
            style={estilos.botao_voltar}
            onPress={() => navegacao.goBack()}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={28}
              color={cor_texto}
            />
          </TouchableOpacity>
          {/* CONTEÚDO CENTRAL */}
          <View style={estilos.conteudo}>
            {/* LOGO E TÍTULO */}
            <View style={estilos.container_logo}>
              <FontAwesome5 name="user-plus" size={40} color={azul_principal} />
              <View style={estilos.container_texto_logo}>
                <Text style={estilos.titulo_logo}>CRIAR CONTA</Text>
                <Text
                  style={[
                    estilos.subtitulo_logo,
                    { color: tema_escuro ? '#A0AEC0' : '#666' },
                  ]}>
                  Junte-se ao Buscando
                </Text>
              </View>
            </View>
            {/* CAMPO: NOME */}
            <View
              style={[
                estilos.container_entrada,
                { backgroundColor: fundo_entrada },
              ]}>
              <MaterialCommunityIcons
                name="account-outline"
                size={20}
                color={cor_texto_fundo}
                style={estilos.icone_entrada}
              />
              <TextInput
                style={[estilos.entrada, { color: cor_texto }]}
                placeholder="Nome completo"
                placeholderTextColor={cor_texto_fundo}
                value={nome}
                onChangeText={set_nome}
              />
            </View>
            {/* CAMPO: E-MAIL */}
            <View
              style={[
                estilos.container_entrada,
                { backgroundColor: fundo_entrada },
              ]}>
              <MaterialCommunityIcons
                name="email-outline"
                size={20}
                color={cor_texto_fundo}
                style={estilos.icone_entrada}
              />
              <TextInput
                style={[estilos.entrada, { color: cor_texto }]}
                placeholder="E-mail"
                placeholderTextColor={cor_texto_fundo}
                value={email}
                onChangeText={set_email}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            {/* CAMPO: SENHA */}
            <View
              style={[
                estilos.container_entrada,
                { backgroundColor: fundo_entrada },
              ]}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color={cor_texto_fundo}
                style={estilos.icone_entrada}
              />
              <TextInput
                style={[estilos.entrada, { color: cor_texto }]}
                placeholder="Senha"
                placeholderTextColor={cor_texto_fundo}
                secureTextEntry
                value={senha}
                onChangeText={set_senha}
              />
            </View>
            {/* CAMPO: CONFIRMAR SENHA */}
            <View
              style={[
                estilos.container_entrada,
                { backgroundColor: fundo_entrada },
              ]}>
              <MaterialCommunityIcons
                name="lock-check-outline"
                size={20}
                color={cor_texto_fundo}
                style={estilos.icone_entrada}
              />
              <TextInput
                style={[estilos.entrada, { color: cor_texto }]}
                placeholder="Confirmar Senha"
                placeholderTextColor={cor_texto_fundo}
                secureTextEntry
                value={confirmar_senha}
                onChangeText={set_confirmar_senha}
              />
            </View>
            {/* BOTÃO CADASTRAR */}
            <TouchableOpacity
              style={estilos.botao_cadastro_principal}
              onPress={fazer_cadastro}>
              <Text style={estilos.texto_botao_cadastro}>Cadastrar</Text>
            </TouchableOpacity>
            {/* LINK PARA A TELA DE LOGIN */}
            <Text style={[estilos.texto_sem_conta, { color: cor_texto }]}>
              Já possui uma conta?
            </Text>
            <TouchableOpacity
              style={estilos.botao_login_voltar}
              onPress={() => navegacao.navigate('Login')}>
              <Text style={[estilos.texto_login_voltar, { color: cor_texto }]}>
                Fazer Login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ===== ESTILOS DA TELA =====
const estilos = StyleSheet.create({
  container: { flex: 1 },
  botao_voltar: { padding: 20, marginTop: 10 },
  conteudo: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: 'center',
    marginTop: 10,
    paddingBottom: 30,
  },
  container_logo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  container_texto_logo: { marginLeft: 15 },
  titulo_logo: { fontSize: 28, fontWeight: 'bold', color: '#2563EB' },
  subtitulo_logo: { fontSize: 13 },
  container_entrada: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 50,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  icone_entrada: { marginRight: 10 },
  entrada: { flex: 1, fontSize: 16 },
  botao_cadastro_principal: {
    width: '100%',
    height: 50,
    backgroundColor: '#2563EB',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    marginTop: 15,
    marginBottom: 30,
  },
  texto_botao_cadastro: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  texto_sem_conta: { fontSize: 16, marginBottom: 10 },
  botao_login_voltar: {
    width: '100%',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  texto_login_voltar: { fontSize: 18, fontWeight: 'bold' },
});
