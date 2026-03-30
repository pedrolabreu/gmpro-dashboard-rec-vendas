/**
 * URL de export direto do Google Sheets — sem cache, sempre atualizado.
 *
 * Requer que a planilha esteja compartilhada com "Qualquer pessoa com o link".
 * Não precisa de "Publicar na web" — usa o export nativo do Sheets.
 *
 * Formato: /export?format=csv&gid=GID_DA_ABA
 * GID 0 = primeira aba (ajuste se necessário)
 */
export const SHEETS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1vI66AYn6y_hdd2XFsYeUm2vrAMSdHaE6eOu5C9B0zyc/export?format=csv&gid=0';
