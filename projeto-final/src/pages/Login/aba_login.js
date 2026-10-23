import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ContextoTema } from '../../contexts/ThemeContext';
import api from '../../connection/api';

// ===== TELA: LOGIN =====
export default function Login() {
  // ===== NAVEGAÇÃO E CONTEXTO GLOBAL =====
  const navegacao = useNavigation();
  const {
    tema_escuro,
    set_logado,
    set_adm,
    set_id_usuario,
    set_usuario,
    set_favoritos_globais,
  } = useContext(ContextoTema);

  // ===== CAMPOS DO FORMULÁRIO =====
  // E-mail e senha digitados.
  const [email, set_email] = useState('');
  const [senha, set_senha] = useState('');

  // ===== CORES DO TEMA =====
  const fundo = tema_escuro ? '#121212' : '#F0F8FF';
  const cor_texto = tema_escuro ? '#FFFFFF' : '#333333';
  const fundo_entrada = tema_escuro ? '#1E1E1E' : '#FFFFFF';
  const cor_texto_fundo = '#9CA3AF';
  const azul_principal = '#2563EB';

  // ===== FAZER LOGIN (POST /login) =====
  // Valida os campos, envia ao servidor e guarda o usuário no contexto.
  const fazer_login = async () => {
    if (email === ''.trim() || senha === ''.trim()) {
      Alert.alert('Atenção', 'Preencha os campos para entrar!');
      return;
    }

    try {
      const resposta = await api.post('/login', {
        email: email.toLowerCase().trim(),
        senha: senha.trim(),
      });

      const dadosUsuario = resposta.data.usuario;

      // ===== GUARDAR USUÁRIO NO CONTEXTO GLOBAL =====
      // Guarda os dados no Contexto Global
      set_id_usuario(dadosUsuario.id_usuario);
      set_adm(dadosUsuario.tipo === 'admin');
      set_logado(true);
      set_usuario({
        id_usuario: dadosUsuario.id_usuario,
        nome: dadosUsuario.nome,
        email: dadosUsuario.email,
        foto: dadosUsuario.foto || null,
      });

      // ===== CARREGAR FAVORITOS DO USUÁRIO =====
      // Busca os favoritos deste utilizador na base de dados
      try {
        const respFavoritos = await api.get(
          `/favoritos/${dadosUsuario.id_usuario}`
        );
        set_favoritos_globais(respFavoritos.data);
      } catch (err) {
        console.log(
          'Aviso: Utilizador ainda não tem favoritos ou ocorreu um erro a carregar.'
        );
        set_favoritos_globais([]);
      }

      Alert.alert('Sucesso', `Bem-vindo(a), ${dadosUsuario.nome}!`);
      set_email('');
      set_senha('');
      navegacao.navigate('Home');
    } catch (erro) {
      // ===== TRATAMENTO DE ERRO =====
      // Erro 401 = e-mail ou senha incorretos.
      if (erro.response && erro.response.status === 401) {
        Alert.alert('Erro', 'E-mail ou senha incorretos.');
      } else {
        Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
        console.error(erro);
      }
    }
  };

  // ===== VISUAL DA TELA (JSX) =====
  return (
    <SafeAreaView style={[estilos.container, { backgroundColor: fundo }]}>
      {/* BOTÃO VOLTAR */}
      <TouchableOpacity
        style={estilos.botao_voltar}
        onPress={() => navegacao.goBack()}>
        <MaterialCommunityIcons name="arrow-left" size={28} color={cor_texto} />
      </TouchableOpacity>
      {/* CONTEÚDO CENTRAL */}
      <View style={estilos.conteudo}>
        {/* LOGO E TÍTULO */}
        <View style={estilos.container_logo}>
          <FontAwesome5 name="bus" size={50} color={azul_principal} />
          <View style={estilos.container_texto_logo}>
            <Text style={estilos.titulo_logo}>BUSCANDO</Text>
            <Text
              style={[
                estilos.subtitulo_logo,
                { color: tema_escuro ? '#A0AEC0' : '#666' },
              ]}>
              Para você não ficar esperando
            </Text>
          </View>
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

        {/* BOTÃO ENTRAR */}
        <TouchableOpacity style={estilos.botao_login} onPress={fazer_login}>
          <Text style={estilos.texto_botao_login}>Entrar</Text>
        </TouchableOpacity>

        {/* LINK PARA A TELA DE CADASTRO */}
        <TouchableOpacity
          style={estilos.botao_cadastro}
          onPress={() => navegacao.navigate('Cadastro')}>
          <Text style={[estilos.texto_cadastro, { color: cor_texto }]}>
            Cadastre-se
          </Text>
        </TouchableOpacity>
      </View>
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
    marginTop: 20,
  },
  container_logo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 50,
  },
  container_texto_logo: { marginLeft: 10 },
  titulo_logo: { fontSize: 28, fontWeight: 'bold', color: '#2563EB' },
  subtitulo_logo: { fontSize: 12 },
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
  botao_login: {
    width: '100%',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    marginTop: 10,
    marginBottom: 30,
  },
  texto_botao_login: { color: '#2563EB', fontSize: 18, fontWeight: 'bold' },
  botao_cadastro: {
    width: '100%',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    marginBottom: 20,
  },
  texto_cadastro: { fontSize: 18, fontWeight: 'bold' },
});
