function norm(s: string | null | undefined) {
  return (s ?? "").trim();
}

function removeAcentosLower(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function slugMunicipio(s: string) {
  return removeAcentosLower(s)
    .replace(/\b(municipio|município)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Remove UF digitada junto do município.
 * Exemplos: "Petrolina/PE", "Petrolina - PE", "Petrolina (PE)", "Petrolina, PE".
 */
export function removerUfDoMunicipio(valor: string) {
  let s = norm(valor);
  if (!s) return "";
  // pontuação de final (ex.: "Pernambuco.")
  s = s.replace(/[.\s]+$/g, "").trim();

  s = s.replace(/\s*[\(\[\{]\s*[A-Za-z]{2}\s*[\)\]\}]\s*$/g, "");
  s = s.replace(/\s*[,\/\-]\s*[A-Za-z]{2}\s*$/g, "");

  // Estado por extenso (foco no caso Pernambuco, mas aceita outros se estiverem no final)
  // Exemplos: "Floresta/Pernambuco.", "Ouricuri Pernambuco", "Araripina - Pernambuco"
  const estadosFim = [
    "pernambuco",
    "alagoas",
    "bahia",
    "ceara",
    "maranhao",
    "paraiba",
    "piaui",
    "rio grande do norte",
    "sergipe",
  ];
  const lowered = removeAcentosLower(s);
  for (const e of estadosFim) {
    const re = new RegExp(String.raw`(\s*[,\/\-]\s*|\s+)${e}\s*$`, "i");
    if (re.test(lowered)) {
      // corta no original, procurando o índice do match no lowered
      const m = lowered.match(re);
      if (m && typeof m.index === "number") {
        s = s.slice(0, m.index).trim();
      }
      break;
    }
  }

  // Se ainda sobrou separador no fim, remove (ex.: "Floresta/")
  s = s.replace(/[,\/\-]\s*$/g, "").trim();

  return s.trim();
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;
  const m = a.length;
  const n = b.length;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j += 1) dp[j] = j;
  for (let i = 1; i <= m; i += 1) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j += 1) {
      const tmp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return dp[n] as number;
}

/**
 * Corrige o município com base numa lista "canônica" (ex.: municipios_sertao).
 * - Remove UF ao final
 * - Faz match exato por normalização (sem acento / pontuação)
 * - Se não achar, tenta fuzzy-match (Levenshtein) para corrigir pequenos typos
 */
export function corrigirMunicipioPeloCatalogo(
  valor: string,
  catalogo: string[]
): { municipio: string; corrigido: boolean; match?: string } {
  const original = norm(valor);
  const semUf = removerUfDoMunicipio(original);
  const alvo = slugMunicipio(semUf);
  if (!alvo) return { municipio: semUf, corrigido: original !== semUf };

  const map = new Map<string, string>();
  for (const c of catalogo) {
    const k = slugMunicipio(c);
    if (k && !map.has(k)) map.set(k, c);
  }

  const exato = map.get(alvo);
  if (exato) {
    const corrigido = exato !== original;
    return { municipio: exato, corrigido, match: exato };
  }

  // fuzzy: aceita correções pequenas (ex.: 1-3 edições dependendo do tamanho)
  let best: { key: string; canon: string; dist: number } | null = null;
  for (const [k, canon] of map.entries()) {
    const d = levenshtein(alvo, k);
    if (!best || d < best.dist) best = { key: k, canon, dist: d };
  }

  if (!best) return { municipio: semUf, corrigido: original !== semUf };

  const len = Math.max(alvo.length, best.key.length);
  const lim = len <= 6 ? 1 : len <= 10 ? 2 : 3;
  if (best.dist <= lim) {
    const corrigido = best.canon !== original;
    return { municipio: best.canon, corrigido, match: best.canon };
  }

  return { municipio: semUf, corrigido: original !== semUf };
}

