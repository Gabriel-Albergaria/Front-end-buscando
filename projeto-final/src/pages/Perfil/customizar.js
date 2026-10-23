import React, { useCallback, useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import { ContextoTema } from '../../contexts/ThemeContext';
import CabecalhoVoltar from '../../components/Cabecalho';
import EntradaTexto from '../../components/CaixaTexto';
import BotaoPadrao from '../../components/Botao';
import api from '../../connection/api';

import imgteste from '../../img/foto.png';

// ===== TRADUZIR ERRO DO AXIOS EM TEXTO =====
// Transforma o erro do axios num texto que diz o que realmente aconteceu
function descrever_erro(e) {
  if (e.response) {
    const dados = e.response.data;
    let corpo = '';
    if (typeof dados === 'string') {
      // o Express devolve uma página HTML; o texto útil fica dentro de <pre>
      const pre = dados.match(/<pre>([\s\S]*?)<\/pre>/);
      corpo = (pre ? pre[1] : dados)
        .replace(/<[^>]+>/g, '')
        .trim()
        .slice(0, 80);
    } else if (dados && dados.erro) {
      corpo = dados.erro;
    }
    return `HTTP ${e.response.status}${corpo ? ' - ' + corpo : ''}`;
  }
  if (e.code === 'ECONNABORTED') {
    return 'tempo esgotado: o servidor não respondeu em 5 segundos';
  }
  return e.message || 'erro desconhecido';
}

// ===== TELA: PERSONALIZAR PERFIL =====
// Permite mudar o nome e a foto do usuário logado.
export default function CustomizarPerfil() {
  // ===== NAVEGAÇÃO E CONTEXTO GLOBAL =====
  const navegacao = useNavigation();
  const { tema_escuro, logado, id_usuario, usuario, set_usuario } =
    useContext(ContextoTema);

  // ===== CORES DO TEMA =====
  const fundo = tema_escuro ? '#121212' : '#F4F7FB';
  const fundo_cartao = tema_escuro ? '#1E1E1E' : '#FFFFFF';
  const cor_texto = tema_escuro ? '#FFFFFF' : '#333333';
  const cor_subtexto = tema_escuro ? '#9CA3AF' : '#6B7280';
  const cor_borda = tema_escuro ? '#333333' : '#E5E7EB';
  const azul_principal = '#2563EB';

  // ===== ESTADOS DA TELA =====
  // nome = campo editável 
  //  foto_nova = foto escolhida ainda não salva 
  //  erro/detalhe_erro = falha ao carregar 
  //  processando_foto e salvando = indicadores de espera.
  const [nome, set_nome] = useState(usuario?.nome || '');
  const [foto_nova, set_foto_nova] = useState(null); // foto escolhida, ainda não salva
  const [erro, set_erro] = useState(false);
  const [detalhe_erro, set_detalhe_erro] = useState('');
  const [processando_foto, set_processando_foto] = useState(false);
  const [salvando, set_salvando] = useState(false);

  // ===== CARREGAR PERFIL (GET /usuarios/:id) =====
  // Busca os dados atuais do usuário no servidor sempre que a tela abre
  const carregar_perfil = useCallback(async () => {
    if (!logado || !id_usuario) return;
    set_erro(false);
    set_detalhe_erro('');
    try {
      const resposta = await api.get(`/usuarios/${id_usuario}`);
      set_usuario(resposta.data);
      set_nome(resposta.data.nome || '');
      set_foto_nova(null);
    } catch (e) {
      console.log('Erro ao carregar o perfil:', e.message);
      set_detalhe_erro(
        `GET ${api.defaults.baseURL}/usuarios/${id_usuario}\n${descrever_erro(
          e
        )}`
      );
      set_erro(true);
    }
  }, [logado, id_usuario]);

  // ===== RECARREGAR AO ENTRAR NA TELA =====
  useFocusEffect(
    useCallback(() => {
      carregar_perfil();
    }, [carregar_perfil])
  );

  // ===== REDUZIR A FOTO E CONVERTER EM TEXTO =====
  // Reduz a foto para 256 px e devolve como texto (data URI). Tenta a API nova
  // do expo-image-manipulator e, se ela falhar, a API antiga.
  const reduzir_foto = async (uri) => {
    try {
      const contexto = ImageManipulator.manipulate(uri);
      contexto.resize({ width: 256 });
      const imagem = await contexto.renderAsync();
      const salva = await imagem.saveAsync({
        format: ImageManipulator.SaveFormat.JPEG,
        compress: 0.6,
        base64: true,
      });
      if (salva.base64) return `data:image/jpeg;base64,${salva.base64}`;
    } catch (e) {
      console.log('API nova do manipulador falhou:', e.message);
    }

    const salva = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 256 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    return `data:image/jpeg;base64,${salva.base64}`;
  };

  // ===== ESCOLHER FOTO NA GALERIA =====
  // Abre a galeria, recorta em quadrado, reduz e prepara para enviar
  const escolher_foto = async () => {
    let etapa = 'abrir a galeria';
    try {
      // O seletor do sistema não exige permissão; se o pedido falhar ou for
      // negado, seguimos assim mesmo.
      try {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      } catch (e) {
        console.log('Pedido de permissão ignorado:', e.message);
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (resultado.canceled) return;

      etapa = 'reduzir a foto';
      set_processando_foto(true);
      const foto = await reduzir_foto(resultado.assets[0].uri);

      if (foto.length > 580000) {
        throw new Error('a foto ficou grande demais, escolha outra');
      }
      set_foto_nova(foto);
    } catch (e) {
      console.log('Erro ao escolher a foto (' + etapa + '):', e.message);
      Alert.alert(
        'Erro',
        'Não foi possível carregar a foto escolhida.\n\nDetalhe (' +
          etapa +
          '): ' +
          e.message
      );
    } finally {
      set_processando_foto(false);
    }
  };

  // ===== SALVAR ALTERAÇÕES (PUT /usuarios/:id) =====
  // Valida o nome e envia só o que mudou (nome e/ou foto).
  const salvar_alteracoes = async () => {
    if (salvando) return;

    const nome_limpo = nome.trim();
    if (nome_limpo === '') {
      Alert.alert('Atenção', 'O nome é obrigatório.');
      return;
    }
    if (nome_limpo.length > 60) {
      Alert.alert('Atenção', 'O nome pode ter no máximo 60 caracteres.');
      return;
    }

    const nome_mudou = nome_limpo !== (usuario?.nome || '');
    if (!nome_mudou && !foto_nova) {
      Alert.alert(
        'Nada para salvar',
        'Você ainda não alterou nenhuma informação.'
      );
      return;
    }

    // manda só o que mudou
    const corpo = {};
    if (nome_mudou) corpo.nome = nome_limpo;
    if (foto_nova) corpo.foto = foto_nova;

    set_salvando(true);
    try {
      const resposta = await api.put(`/usuarios/${id_usuario}`, corpo);
      set_usuario(resposta.data); // o resto do app já passa a usar o nome/foto novos
      set_foto_nova(null);
      Alert.alert('Sucesso', 'Seu perfil foi atualizado!');
      navegacao.goBack();
    } catch (e) {
      Alert.alert(
        'Erro',
        e.response?.data?.erro ||
          'Não foi possível salvar. Verifique a conexão e tente de novo.'
      );
    } finally {
      set_salvando(false);
    }
  };

  // ===== TELA PARA QUEM NÃO ESTÁ LOGADO =====
  // ---------- NÃO LOGADO ----------
  if (!logado) {
    return (
      <SafeAreaView style={[estilos.container, { backgroundColor: fundo }]}>
        <CabecalhoVoltar titulo="Personalizar Perfil" />
        <View style={estilos.centro}>
          <Ionicons
            name="person-circle-outline"
            size={90}
            color={cor_subtexto}
            style={{ opacity: 0.5 }}
          />
          <Text
            style={{
              color: cor_texto,
              fontSize: 18,
              fontWeight: 'bold',
              marginTop: 10,
            }}>
            Sessão não iniciada!
          </Text>
          <Text
            style={{ color: cor_subtexto, marginTop: 8, textAlign: 'center' }}>
            Faça login para editar o seu perfil.
          </Text>
          <TouchableOpacity
            style={[estilos.botao_login, { backgroundColor: azul_principal }]}
            onPress={() => navegacao.navigate('Login')}>
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>
              Fazer Login
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ===== FOTO MOSTRADA NO AVATAR =====
  // Prioridade: foto nova, depois foto salva, depois foto padrão.
  const fonte_avatar = foto_nova
    ? { uri: foto_nova }
    : usuario?.foto
    ? { uri: usuario.foto }
    : imgteste;

  // ===== VISUAL DA TELA (JSX) =====
  return (
    <SafeAreaView style={[estilos.container, { backgroundColor: fundo }]}>
      {/* CABEÇALHO */}
      <CabecalhoVoltar titulo="Personalizar Perfil" />

      {/* TECLADO NÃO COBRE OS CAMPOS */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        {/* ROLAGEM DA TELA */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={estilos.conteudo}>
          {/* AVISO DE ERRO AO CARREGAR (TOQUE PARA TENTAR DE NOVO) */}
          {erro && (
            <TouchableOpacity
              style={estilos.aviso_erro}
              onPress={carregar_perfil}>
              <MaterialCommunityIcons
                name="cloud-off-outline"
                size={18}
                color="#B45309"
              />
              <View style={{ marginLeft: 8, flex: 1 }}>
                <Text style={{ color: '#B45309', fontSize: 13 }}>
                  Não foi possível atualizar os dados do servidor. Toque para
                  tentar de novo.
                </Text>
                {detalhe_erro !== '' && (
                  <Text
                    style={{ color: '#92400E', fontSize: 11, marginTop: 6 }}>
                    {detalhe_erro}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}

          {/* FOTO DE PERFIL */}
          <View style={estilos.secao_foto}>
            <View style={estilos.container_avatar}>
              <Image source={fonte_avatar} style={estilos.avatar} />
              {processando_foto && (
                <View style={estilos.carregando_foto}>
                  <ActivityIndicator color="#FFF" />
                </View>
              )}
              {/* BOTÃO PARA TROCAR A FOTO */}
              <TouchableOpacity
                style={[
                  estilos.botao_editar_foto,
                  { backgroundColor: azul_principal, borderColor: fundo },
                ]}
                onPress={escolher_foto}
                disabled={processando_foto}>
                <MaterialCommunityIcons
                  name="camera-outline"
                  size={20}
                  color="#FFF"
                />
              </TouchableOpacity>
            </View>
            {/* TEXTO: MUDAR FOTO DE PERFIL */}
            <Text
              style={[estilos.texto_alterar_foto, { color: azul_principal }]}
              onPress={escolher_foto}>
              Mudar foto de perfil
            </Text>
            {foto_nova && (
              <Text style={{ color: cor_subtexto, fontSize: 12, marginTop: 4 }}>
                Nova foto selecionada. Toque em "Salvar Alterações" para
                confirmar.
              </Text>
            )}
          </View>

          {/* FORMULÁRIO: INFORMAÇÕES PESSOAIS */}
          <View
            style={[
              estilos.cartao_formulario,
              { backgroundColor: fundo_cartao, borderColor: cor_borda },
            ]}>
            <Text style={[estilos.titulo_secao, { color: cor_texto }]}>
              Informações Pessoais
            </Text>

            {/* CAMPO: NOME (EDITÁVEL) */}
            <EntradaTexto
              rotulo="Nome Completo"
              valor={nome}
              ao_mudar={set_nome}
              placeholder="Seu nome..."
            />

            {/* E-mail: só visualização, não pode ser alterado */}
            <Text style={[estilos.rotulo, { color: cor_subtexto }]}>
              E-mail
            </Text>
            <View
              style={[
                estilos.campo_bloqueado,
                {
                  backgroundColor: tema_escuro ? '#262626' : '#F1F5F9',
                  borderColor: cor_borda,
                },
              ]}>
              <Text
                style={{ flex: 1, color: cor_subtexto, fontSize: 15 }}
                numberOfLines={1}>
                {usuario?.email || '—'}
              </Text>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={cor_subtexto}
              />
            </View>
          </View>

          {/* BOTÃO: SALVAR ALTERAÇÕES */}
          <View style={estilos.espaco_botao}>
            <BotaoPadrao
              texto={salvando ? 'Salvando...' : 'Salvar Alterações'}
              ao_pressionar={salvar_alteracoes}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ===== ESTILOS DA TELA =====
const estilos = StyleSheet.create({
  container: {
    flex: 1,
  },
  centro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  botao_login: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 20,
  },
  conteudo: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  aviso_erro: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    marginTop: 15,
  },
  secao_foto: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  container_avatar: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E2E8F0',
  },
  carregando_foto: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botao_editar_foto: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  texto_alterar_foto: {
    fontSize: 16,
    fontWeight: '600',
  },
  cartao_formulario: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    paddingTop: 25,
  },
  titulo_secao: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  rotulo: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  campo_bloqueado: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
  },
  espaco_botao: {
    marginTop: 30,
  },
});
