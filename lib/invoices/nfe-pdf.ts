import { createHash } from "node:crypto";
import { inflateSync } from "node:zlib";
import { parseNfeXml, type ParsedNfe, type ParsedNfeItem } from "./nfe.ts";

function decodePdfLiteral(value: string) {
  return value
    .replace(/\\([()\\])/g, "$1")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\b/g, "\b")
    .replace(/\\f/g, "\f")
    .replace(/\\([0-7]{1,3})/g, (_, octal: string) =>
      String.fromCharCode(parseInt(octal, 8))
    );
}

function decodeHexString(value: string) {
  const clean = value.replace(/\s+/g, "");
  if (!clean || clean.length % 2 !== 0) return "";
  const bytes = Buffer.from(clean, "hex");
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    let out = "";
    for (let i = 2; i + 1 < bytes.length; i += 2) {
      out += String.fromCharCode(bytes.readUInt16BE(i));
    }
    return out;
  }
  return bytes.toString("latin1");
}

function textFromContentStream(content: string) {
  const parts: string[] = [];
  const tj = /\((?:\\.|[^\\)])*\)\s*Tj/g;
  let match: RegExpExecArray | null;
  while ((match = tj.exec(content))) {
    const raw = match[0].replace(/\s*Tj$/, "");
    parts.push(decodePdfLiteral(raw.slice(1, -1)));
  }

  const hexTj = /<([0-9A-Fa-f\s]+)>\s*Tj/g;
  while ((match = hexTj.exec(content))) {
    parts.push(decodeHexString(match[1]));
  }

  const arrays = /\[([\s\S]*?)\]\s*TJ/g;
  while ((match = arrays.exec(content))) {
    const inner = match[1];
    const tokens = inner.match(/\((?:\\.|[^\\)])*\)|<[0-9A-Fa-f\s]+>/g) ?? [];
    const text = tokens
      .map((token) =>
        token.startsWith("(")
          ? decodePdfLiteral(token.slice(1, -1))
          : decodeHexString(token.slice(1, -1))
      )
      .join("");
    if (text) parts.push(text);
  }
  return parts.join("\n");
}

function decodedStreams(buffer: Buffer) {
  const latin = buffer.toString("latin1");
  const streams: Buffer[] = [];
  const regex = /stream\r?\n/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(latin))) {
    const start = match.index + match[0].length;
    const end = latin.indexOf("endstream", start);
    if (end < 0) break;
    const dictStart = Math.max(0, latin.lastIndexOf("<<", match.index));
    const dict = latin.slice(dictStart, match.index);
    let raw = buffer.subarray(start, end);
    while (raw.length && (raw[raw.length - 1] === 10 || raw[raw.length - 1] === 13)) {
      raw = raw.subarray(0, raw.length - 1);
    }
    if (/\/FlateDecode/.test(dict)) {
      try {
        streams.push(inflateSync(raw));
      } catch {
        // Stream inválido ou filtro adicional: ignora e continua.
      }
    } else {
      streams.push(Buffer.from(raw));
    }
    regex.lastIndex = end + "endstream".length;
  }
  return streams;
}

function findEmbeddedXml(buffer: Buffer, streams: Buffer[]) {
  for (const candidate of [buffer, ...streams]) {
    const text = candidate.toString("utf8");
    const start = Math.max(text.indexOf("<nfeProc"), text.indexOf("<NFe"));
    if (start < 0) continue;
    const procEnd = text.indexOf("</nfeProc>", start);
    const nfeEnd = text.indexOf("</NFe>", start);
    const end = procEnd >= 0 ? procEnd + 10 : nfeEnd >= 0 ? nfeEnd + 6 : -1;
    if (end > start) return text.slice(start, end);
  }
  return null;
}

function compactDigits(value: string) {
  return value.replace(/\D/g, "");
}

function decimalPtBr(value: string) {
  const normalized = value.includes(",")
    ? value.replace(/\./g, "").replace(",", ".")
    : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pickIssuerName(lines: string[], cnpjLineIndex: number) {
  const ignored = /(DANFE|DOCUMENTO AUXILIAR|NOTA FISCAL|CHAVE DE ACESSO|CNPJ|INSCRIÇÃO|PROTOCOLO|FOLHA|SÉRIE|N[ºO]\b)/i;
  const candidates = lines
    .slice(Math.max(0, cnpjLineIndex - 10), cnpjLineIndex)
    .map((line) => line.trim())
    .filter((line) => line.length >= 4 && !ignored.test(line) && !/^\d[\d\s./-]+$/.test(line));
  return candidates.sort((a, b) => b.length - a.length)[0] ?? "";
}

function extractItemRows(lines: string[]): ParsedNfeItem[] {
  const items: ParsedNfeItem[] = [];
  const row =
    /^(\S+)\s+(.+?)\s+(\d{8})\s+(\d{4})\s+([A-Z]{1,6})\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)(?:\s|$)/i;

  for (const line of lines) {
    const match = line.match(row);
    if (!match) continue;
    const quantity = decimalPtBr(match[6]);
    const unitValue = decimalPtBr(match[7]);
    const totalValue = decimalPtBr(match[8]);
    if (!quantity || !totalValue) continue;

    items.push({
      lineNumber: items.length + 1,
      supplierCode: match[1],
      ean: null,
      description: match[2].trim(),
      ncm: match[3],
      cfop: match[4],
      unit: match[5].toUpperCase(),
      quantity,
      unitValue,
      totalValue,
    });
  }
  return items;
}

export function parseNfeDanfeText(text: string, fileHash = ""): ParsedNfe {
  const lines = text
    .replace(/\u0000/g, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const joined = lines.join("\n");
  const accessMatch =
    joined.match(/CHAVE\s+DE\s+ACESSO[\s\S]{0,120}?((?:\d[ .-]*){44})/i) ??
    joined.match(/((?:\d[ .-]*){44})/);
  const accessKey = accessMatch ? compactDigits(accessMatch[1]) : "";
  if (accessKey.length !== 44) throw new Error("pdf_missing_access_key");

  const cnpjIndex = lines.findIndex((line) => /CNPJ/i.test(line));
  let issuerCnpj = "";
  for (let i = cnpjIndex >= 0 ? cnpjIndex : 0; i < Math.min(lines.length, (cnpjIndex >= 0 ? cnpjIndex : 0) + 8); i++) {
    const match = lines[i].match(/\d{2}[.]?\d{3}[.]?\d{3}[\/]?\d{4}[-]?\d{2}/);
    if (match) {
      issuerCnpj = compactDigits(match[0]);
      break;
    }
  }
  if (issuerCnpj.length !== 14) {
    const any = joined.match(/\d{2}[.]?\d{3}[.]?\d{3}[\/]?\d{4}[-]?\d{2}/);
    issuerCnpj = any ? compactDigits(any[0]) : "";
  }
  if (issuerCnpj.length !== 14) throw new Error("pdf_missing_cnpj");

  const issuerName = pickIssuerName(lines, cnpjIndex >= 0 ? cnpjIndex : 10);
  if (!issuerName) throw new Error("pdf_missing_issuer");

  const numberMatch =
    joined.match(/(?:N[º°O.]|NÚMERO)\s*[:.-]?\s*([0-9.]{1,15})/i) ??
    joined.match(/NF[- ]?E\s*[:.-]?\s*([0-9.]{1,15})/i);
  const invoiceNumber = numberMatch ? compactDigits(numberMatch[1]) : "";
  if (!invoiceNumber) throw new Error("pdf_missing_invoice_number");

  const seriesMatch = joined.match(/S[ÉE]RIE\s*[:.-]?\s*(\d{1,4})/i);
  const totalMatch = joined.match(/VALOR\s+TOTAL\s+DA\s+NOTA[\s\S]{0,80}?([\d.]+,\d{2}|\d+\.\d{2})/i);
  const dateMatch = joined.match(/DATA\s+DA\s+EMISS[ÃA]O[\s\S]{0,60}?(\d{2}\/\d{2}\/\d{4})/i);

  const items = extractItemRows(lines);
  if (items.length === 0) throw new Error("pdf_items_not_found");

  const computedTotal = items.reduce((sum, item) => sum + item.totalValue, 0);
  const totalAmount = totalMatch ? decimalPtBr(totalMatch[1]) : computedTotal;

  let issuedAt: string | null = null;
  if (dateMatch) {
    const [day, month, year] = dateMatch[1].split("/");
    issuedAt = `${year}-${month}-${day}`;
  }

  return {
    accessKey,
    invoiceNumber,
    series: seriesMatch?.[1] ?? null,
    issuerCnpj,
    issuerName,
    issuedAt,
    totalAmount,
    xmlHash: fileHash,
    items,
  };
}

export function parseNfePdf(input: Uint8Array): ParsedNfe {
  const buffer = Buffer.from(input);
  if (buffer.length < 100 || !buffer.subarray(0, 5).toString("ascii").startsWith("%PDF")) {
    throw new Error("invalid_pdf");
  }

  const streams = decodedStreams(buffer);
  const embeddedXml = findEmbeddedXml(buffer, streams);
  if (embeddedXml) return parseNfeXml(embeddedXml);

  const extracted = [
    textFromContentStream(buffer.toString("latin1")),
    ...streams.map((stream) => textFromContentStream(stream.toString("latin1"))),
  ]
    .filter(Boolean)
    .join("\n");

  if (extracted.trim().length < 40) throw new Error("pdf_text_not_found");

  const hash = createHash("sha256").update(buffer).digest("hex");
  return parseNfeDanfeText(extracted, hash);
}
