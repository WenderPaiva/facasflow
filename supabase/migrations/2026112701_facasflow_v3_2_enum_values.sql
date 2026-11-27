-- ============================================================================
-- FacasFlow V3.2 (Parte 1): Extensão do Enum despesa_categoria
-- Deve rodar em transação separada antes de referenciar os novos valores.
-- ============================================================================

alter type public.despesa_categoria add value if not exists 'transportes';
alter type public.despesa_categoria add value if not exists 'custo_depreciacao';
alter type public.despesa_categoria add value if not exists 'folha_colaboradores';
alter type public.despesa_categoria add value if not exists 'prestadores_servico';
