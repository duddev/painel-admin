// =============================================================
// ARQUIVO: supabase.js
// FUNÇÃO: Centraliza a conexão com o Supabase.
//
// IMPORTANTE:
// - NÃO alterei a URL nem a chave/API key.
// - Se futuramente trocar de projeto Supabase, é AQUI que troca.
// - O admin.js importa o cliente `sb` deste arquivo.
// =============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const sb = createClient(
  'https://vgoqbaxragkkfqnmzlrq.supabase.co',
  'sb_publishable_bJ23lq8V3rmZI3FV_bd3mg_N9YIqMlx'
);
