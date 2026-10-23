import React, { useContext, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Home from '../pages/Home';
import Configuracoes from '../pages/Configuracoes/aba_config';
import Login from '../pages/Login/aba_login';
import Cadastro from '../pages/Login/aba_cadastro';
import Favoritos from '../pages/Favoritos/aba_favoritos';
import Feedback from '../pages/Feedback/aba_sugest';
import GestaoRotas from '../pages/Gestao/aba_gestao';
import CriarRota from '../pages/Gestao/aba_nova_rota';
import EditarRota from '../pages/Gestao/aba_editar';
import SimulacaoOnibus from '../pages/Gestao/aba_simulacao';
import Sobre from '../pages/Sobre/aba_sobre';
import Ponto from '../pages/Gestao/aba_ponto';
import CustomizarPerfil from '../pages/Perfil/customizar';
import Rastreamento from '../pages/Rastreamento/aba_rastreamento';
import { ContextoTema } from '../contexts/ThemeContext';
import imglogoff from '../img/logoff.png';
import imgteste from '../img/foto.png';
import api from '../connection/api';
import SugestoesRecebidas from '../pages/Feedback/aba_sugest_recebida';

// ===== NAVEGADOR DE GAVETA (MENU LATERAL) =====
const Gaveta = createDrawerNavigator();

// ===== MENU LATERAL PERSONALIZADO =====
function ConteudoPersonalizadoGaveta(props) {
  const {
    tema_escuro,
    logado,
    set_logado,
    adm,
    set_adm,
    usuario,
    set_usuario,
    id_usuario,
  } = useContext(ContextoTema);

  // ===== O MENU ESTÁ ABERTO? =====
  // O menu está aberto? (o estado do menu guarda um item "drawer" enquanto aberto)
  const menu_aberto = !!props.state?.history?.some((item) => item.type === 'drawer');

  // ===== ATUALIZAR NOME E FOTO AO ABRIR O MENU =====
  // Sempre que o menu abre, busca nome e foto atualizados no servidor.
  // Assim ele reflete o que foi salvo no "Personalizar perfil".
  useEffect(() => {
    if (!menu_aberto || !logado || !id_usuario) return;
    let ativo = true;
    api
      .get(`/usuarios/${id_usuario}`)
      .then((resposta) => {
        if (ativo) set_usuario(resposta.data);
      })
      .catch(() => {
        // sem conexão: continua mostrando o que já estava guardado
      });
    return () => {
      ativo = false;
    };
  }, [menu_aberto, logado, id_usuario]);

  // ===== CORES DO MENU (TEMA) =====
  const escuro = tema_escuro;
  const fundo = escuro ? '#121212' : '#FFFFFF';
  const fundo_container = escuro ? '#000000' : '#F8FAFC';
  const fundo_rodape = escuro ? '#1A1A1A' : '#EEF2F6';
  const cor_texto = escuro ? '#E2E8F0' : '#1E1B4B';
  const cor_subtexto = escuro ? '#94A3B8' : '#64748B';
  const cor_icone = escuro ? '#CBD5E1' : '#333';
  const cor_divisoria = escuro ? '#334155' : '#E2E8F0';
  // ===== ITEM DO MENU (COMPONENTE INTERNO) =====
  const ItemGaveta = ({
    icone,
    rotulo,
    mostrar_seta,
    distintivo,
    ao_pressionar,
  }) => (
    <TouchableOpacity
      style={[estilos.item_gaveta, { backgroundColor: fundo }]}
      onPress={ao_pressionar}>
      <View style={estilos.esquerda_item_gaveta}>
        <MaterialCommunityIcons name={icone} size={24} color={cor_icone} />
        {distintivo && (
          <View style={estilos.distintivo}>
            <Text style={estilos.texto_distintivo}>{distintivo}</Text>
          </View>
        )}
        <Text style={[estilos.rotulo_item_gaveta, { color: cor_texto }]}>
          {rotulo}
        </Text>
      </View>
      {mostrar_seta && (
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={cor_subtexto}
        />
      )}
    </TouchableOpacity>
  );
  // ===== ESTRUTURA DO MENU =====
  return (
    <View
      style={[estilos.container_gaveta, { backgroundColor: fundo_container }]}>
      {/* CABEÇALHO DO MENU: FOTO E NOME */}
      <View style={[estilos.secao_info_usuario, { backgroundColor: fundo }]}>
        <Image
          source={
            logado
              ? usuario?.foto
                ? { uri: usuario.foto }
                : imgteste
              : imglogoff
          }
          style={estilos.avatar}
        />
        <View style={estilos.texto_info_usuario}>
          {logado ? (
            <>
              <Text style={[estilos.nome_usuario, { color: cor_texto }]}>
                {usuario?.nome || (adm ? 'Administrador' : 'Usuário')}
              </Text>
              <TouchableOpacity
                onPress={() => props.navigation.navigate('CustomizarPerfil')}>
                <Text style={estilos.texto_personalizar}>
                  Personalizar perfil
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[estilos.nome_usuario, { color: cor_texto }]}>
                Bem-vindo(a)!
              </Text>
              <TouchableOpacity
                onPress={() => props.navigation.navigate('Login')}>
                <Text style={estilos.texto_login}>Fazer Login / Cadastrar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      <View style={[estilos.divisoria, { backgroundColor: cor_divisoria }]} />
      {/* ITENS DO MENU: ADM OU USUÁRIO COMUM */}
      {adm ? (
        <>
          {/* ADM: GESTÃO DE ROTAS */}
          <ItemGaveta
            icone="map-marker-path"
            rotulo="Gestão de Rotas"
            mostrar_seta
            ao_pressionar={() => props.navigation.navigate('GestaoRotas')}
          />
          <View
            style={[estilos.divisoria, { backgroundColor: cor_divisoria }]}
          />
          {/* ADM: NOVO PONTO */}
          <ItemGaveta
            icone="map-marker-plus"
            rotulo="Novo Ponto"
            mostrar_seta
            ao_pressionar={() => props.navigation.navigate('Ponto')}
          />
          <View
            style={[estilos.divisoria, { backgroundColor: cor_divisoria }]}
          />
          {/* ADM: SUGESTÕES RECEBIDAS */}
          <ItemGaveta
            icone="message-text-outline"
            rotulo="Sugestões recebidas"
            mostrar_seta
            ao_pressionar={() =>
              props.navigation.navigate('SugestoesRecebidas')
            }
          />
          <View
            style={[estilos.divisoria, { backgroundColor: cor_divisoria }]}
          />
        </>
      ) : (
        <>
          {/* USUÁRIO: FAVORITOS */}
          <ItemGaveta
            icone="star-outline"
            rotulo="Favoritos"
            mostrar_seta
            ao_pressionar={() => props.navigation.navigate('Favoritos')}
          />
          <View
            style={[estilos.divisoria, { backgroundColor: cor_divisoria }]}
          />         
          {/* USUÁRIO: ENVIAR SUGESTÃO */}
          <ItemGaveta
            icone="message-outline"
            rotulo="Enviar sugestão"
            mostrar_seta
            ao_pressionar={() => props.navigation.navigate('Feedback')}
          />
          <View
            style={[estilos.divisoria, { backgroundColor: cor_divisoria }]}
          />
          {/* USUÁRIO: SOBRE O APP */}
          <ItemGaveta
            icone="information"
            rotulo="Sobre o app"
            mostrar_seta
            ao_pressionar={() => props.navigation.navigate('Sobre')}
          />
          <View
            style={[estilos.divisoria, { backgroundColor: cor_divisoria }]}
          />
        </>
      )}
      {/* CONFIGURAÇÕES (TODOS) */}
      <ItemGaveta
        icone="cog-outline"
        rotulo="Configurações"
        mostrar_seta
        ao_pressionar={() => props.navigation.navigate('Configuracoes')}
      />
      {/* RODAPÉ DO MENU: BOTÃO SAIR (LOGOUT) */}
      <View style={[estilos.secao_inferior, { backgroundColor: fundo_rodape }]}>
        <View style={[estilos.divisoria, { backgroundColor: cor_divisoria }]} />
        {logado && (
          <ItemGaveta
            icone="power"
            rotulo="Sair"
            ao_pressionar={() => {
              set_logado(false);
              set_adm(false);
              set_usuario(null);
            }}
          />
        )}
      </View>
    </View>
  );
}

// ===== TELAS DO APP (NAVEGAÇÃO) =====
// Cada Gaveta.Screen abaixo é uma tela que pode ser aberta com navigate(nome).
export default function Rotas() {
  const { tema_escuro } = useContext(ContextoTema);
  const escuro = tema_escuro;
  return (
    <Gaveta.Navigator
      drawerContent={(props) => <ConteudoPersonalizadoGaveta {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        sceneContainerStyle: {
          backgroundColor: escuro ? '#000000' : '#FFFFFF',
        },
        overlayColor: escuro ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
        drawerStyle: {
          backgroundColor: escuro ? '#121212' : '#FFFFFF',
          width: '80%',
        },
      }}>
      {/* TELAS: HOME (MAPA) E CONFIGURAÇÕES */}
      <Gaveta.Screen name="Home" component={Home} />
      <Gaveta.Screen name="Configuracoes" component={Configuracoes} />
      {/* TELAS: LOGIN E CADASTRO */}
      <Gaveta.Screen
        name="Login"
        component={Login}
        options={{ swipeEnabled: false }}
      />
      <Gaveta.Screen
        name="Cadastro"
        component={Cadastro}
        options={{ swipeEnabled: false }}
      />
      {/* TELA: PERFIL */}
      <Gaveta.Screen name="CustomizarPerfil" component={CustomizarPerfil} />
      {/* TELAS DO USUÁRIO: FAVORITOS E SUGESTÃO */}
      <Gaveta.Screen name="Favoritos" component={Favoritos} />
      <Gaveta.Screen name="Feedback" component={Feedback} />
      {/* TELAS DO ADM: GESTÃO, CRIAR, EDITAR, SIMULAÇÃO E NOVO PONTO */}
      <Gaveta.Screen name="GestaoRotas" component={GestaoRotas} />
      <Gaveta.Screen name="CriarRota" component={CriarRota} />
      <Gaveta.Screen name="EditarRota" component={EditarRota} />
      <Gaveta.Screen name="SimulacaoOnibus" component={SimulacaoOnibus} />
      <Gaveta.Screen name="Ponto" component={Ponto} />
      {/* TELAS: SOBRE, RASTREAMENTO E SUGESTÕES RECEBIDAS */}
      <Gaveta.Screen name="Sobre" component={Sobre} />
      <Gaveta.Screen name="Rastreamento" component={Rastreamento} />
      <Gaveta.Screen name="SugestoesRecebidas" component={SugestoesRecebidas} />
    </Gaveta.Navigator>
  );
}

// ===== ESTILOS DO MENU =====
const estilos = StyleSheet.create({
  container_gaveta: { flex: 1 },
  secao_info_usuario: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E2E8F0',
  },
  texto_info_usuario: { marginLeft: 15 },
  nome_usuario: { fontSize: 18, fontWeight: 'bold' },
  texto_personalizar: {
    fontSize: 14,
    color: '#2563EB',
    marginTop: 2,
    fontWeight: '500',
  },
  texto_login: {
    fontSize: 14,
    color: '#2563EB',
    marginTop: 2,
    fontWeight: 'bold',
  },
  divisoria: { height: 1 },
  item_gaveta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  esquerda_item_gaveta: { flexDirection: 'row', alignItems: 'center' },
  rotulo_item_gaveta: { fontSize: 16, marginLeft: 20 },
  distintivo: {
    position: 'absolute',
    top: -5,
    left: 12,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  texto_distintivo: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  secao_inferior: { marginTop: 'auto' },
});