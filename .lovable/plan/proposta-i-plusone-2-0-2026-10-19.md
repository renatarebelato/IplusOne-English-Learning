# Proposta: I-PlusOne 2.0

Objetivo: transformar o app de uma página única em um "treinador diário de vocabulário" pelo método i+1, com visual preto + verde folha e o logo novo.

## 1. Estrutura com menu lateral
- Logo I-PlusOne no topo do menu.
- Páginas: **Hoje**, **Revisar**, **Histórico**, **Progresso**, **Anki**.
- No celular, o menu vira uma barra inferior.

## 2. Login e conta
- Entrar com Google ou e-mail.
- Histórico, sequência de dias e preferências salvos na conta, em qualquer aparelho.
- Perfil: nome, idioma estudado (inglês, espanhol...), nível (A1–C2) e meta diária (5, 10 ou 15 palavras).

## 3. Página "Hoje"
- Saudação: "Sua jornada de hoje, Renata" com selo "Método i+1 · aprendizado diário".
- Caixa de palavras com contador e barra de progresso da meta.
- Frases geradas no nível do usuário (só uma palavra nova por frase = i+1), com:
  - tradução escondida (toque para revelar),
  - botão de ouvir a pronúncia,
  - 3 contextos diferentes (conversa, trabalho, notícia),
  - opção de gerar de novo uma frase específica.

## 4. Página "Revisar" (novidade)
- Mini-quiz das palavras dos últimos dias: completar a frase com a palavra que falta.
- Marcar "sei / quase / não sei" para priorizar as próximas revisões.

## 5. Página "Progresso" (novidade)
- Sequência de dias, total de palavras aprendidas, calendário de atividade estilo "mapa de calor".
- Conquistas: 7 dias seguidos, 100 palavras, etc.

## 6. Página "Histórico"
- Lista por dia com busca por palavra, reexportar para o Anki e excluir.

## 7. Página "Anki"
- Passo a passo ilustrado de como importar e sincronizar com o AnkiWeb.
- Escolher o nome do baralho e o formato do card (frente/verso, com áudio).

## 8. Extras
- Lembrete diário por e-mail (liga/desliga).
- Botão "Compre um cafezinho" no topo (link que você indicar).

## Ordem sugerida
1. Menu lateral + login + perfil
2. Hoje melhorada
3. Histórico e Progresso
4. Revisar
5. Lembrete por e-mail e cafezinho

## Detalhes técnicos
- Lovable Cloud para contas e dados (tabelas: perfil, dias de estudo, palavras com status de revisão), com acesso restrito ao dono.
- IA via Lovable AI para frases e quiz; áudio pela voz do navegador.
- Exportação para o Anki continua por arquivo.
