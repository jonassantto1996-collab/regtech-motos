"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import type { Product, ProductColor, ProductSpec } from "./types";

type SpecEntry = { key: string; value: string };

type ProductFormProps = {
  mode: "create" | "edit";
  action: (formData: FormData) => void;
  defaultValues?: Partial<Product>;
  defaultColors?: ProductColor[];
  defaultSpecs?: ProductSpec[];
  errorMessage?: string | null;
};

export function ProductForm({
  mode,
  action,
  defaultValues,
  defaultColors,
  defaultSpecs,
  errorMessage,
}: ProductFormProps) {
  const [colors, setColors] = useState<string[]>(
    (defaultColors ?? []).map((c) => c.color)
  );
  const [colorInput, setColorInput] = useState("");

  const [specs, setSpecs] = useState<SpecEntry[]>(
    (defaultSpecs ?? []).map((s) => ({ key: s.spec_key, value: s.spec_value }))
  );
  const [specKeyInput, setSpecKeyInput] = useState("");
  const [specValueInput, setSpecValueInput] = useState("");

  function addColor() {
    const trimmed = colorInput.trim();
    if (!trimmed || colors.includes(trimmed)) return;
    setColors((prev) => [...prev, trimmed]);
    setColorInput("");
  }

  function removeColor(color: string) {
    setColors((prev) => prev.filter((c) => c !== color));
  }

  function addSpec() {
    const key = specKeyInput.trim();
    const value = specValueInput.trim();
    if (!key || !value || specs.some((s) => s.key === key)) return;
    setSpecs((prev) => [...prev, { key, value }]);
    setSpecKeyInput("");
    setSpecValueInput("");
  }

  function removeSpec(key: string) {
    setSpecs((prev) => prev.filter((s) => s.key !== key));
  }

  return (
    <form action={action} style={{ maxWidth: 480 }}>
      {/* Cores e specs vao pro servidor como JSON num campo escondido —
          evita depender de indices alinhados entre multiplos inputs. */}
      <input type="hidden" name="colors_json" value={JSON.stringify(colors)} />
      <input type="hidden" name="specs_json" value={JSON.stringify(specs)} />

      <h2 style={sectionHeading}>Dados básicos</h2>

      <Field label="Marca" htmlFor="brand" required>
        <input
          id="brand"
          name="brand"
          type="text"
          required
          defaultValue={defaultValues?.brand}
          style={inputStyle}
        />
      </Field>

      <Field label="Modelo" htmlFor="model" required>
        <input
          id="model"
          name="model"
          type="text"
          required
          defaultValue={defaultValues?.model}
          style={inputStyle}
        />
      </Field>

      <Field
        label="Slug"
        htmlFor="slug"
        hint={
          mode === "create"
            ? "Deixe em branco para gerar automaticamente a partir de marca + modelo."
            : "Alterar aqui muda a URL do produto. Deixe como está se não for necessário."
        }
      >
        <input
          id="slug"
          name="slug"
          type="text"
          defaultValue={defaultValues?.slug}
          style={inputStyle}
        />
      </Field>

      <Field label="SKU" htmlFor="sku" hint="Opcional. Se informado, deve ser único.">
        <input
          id="sku"
          name="sku"
          type="text"
          defaultValue={defaultValues?.sku ?? ""}
          style={inputStyle}
        />
      </Field>

      <Field label="Categoria" htmlFor="category" required>
        <input
          id="category"
          name="category"
          type="text"
          required
          defaultValue={defaultValues?.category}
          style={inputStyle}
        />
      </Field>

      <Field label="Descrição" htmlFor="description" required>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          defaultValue={defaultValues?.description}
          style={{ ...inputStyle, resize: "vertical" as const }}
        />
      </Field>

      <Field label="Preço (R$)" htmlFor="price" required>
        <input
          id="price"
          name="price"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={defaultValues?.price}
          style={inputStyle}
        />
      </Field>

      <Field label="Disponibilidade" htmlFor="availability" required>
        <input
          id="availability"
          name="availability"
          type="text"
          required
          defaultValue={defaultValues?.availability}
          style={inputStyle}
        />
      </Field>

      <Field label="Garantia" htmlFor="warranty" required>
        <input
          id="warranty"
          name="warranty"
          type="text"
          required
          defaultValue={defaultValues?.warranty}
          style={inputStyle}
        />
      </Field>

      <div style={{ marginBottom: "1rem" }}>
        <label>
          <input
            type="checkbox"
            name="pickup_available"
            defaultChecked={defaultValues?.pickup_available ?? false}
          />{" "}
          Retirada disponível
        </label>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <label>
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={defaultValues?.is_active ?? true}
          />{" "}
          Produto ativo (visível quando o catálogo público existir)
        </label>
      </div>

      {mode === "create" && (
        <div style={{ marginTop: "2rem", marginBottom: "0.5rem" }}>
          <h2 style={sectionHeading}>Imagens</h2>
          <p style={{ color: "#666" }}>
            Salve o produto primeiro para poder adicionar imagens.
          </p>
        </div>
      )}

      <h2 style={sectionHeading}>Cores</h2>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <input
          type="text"
          value={colorInput}
          onChange={(e) => setColorInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addColor();
            }
          }}
          placeholder="Ex: Preto"
          style={inputStyle}
        />
        <button type="button" onClick={addColor} style={secondaryButtonStyle}>
          Adicionar
        </button>
      </div>
      {colors.length === 0 && (
        <p style={{ color: "#666", marginBottom: "1.5rem" }}>
          Nenhuma cor adicionada.
        </p>
      )}
      {colors.length > 0 && (
        <ul style={{ paddingLeft: "1.2rem", marginBottom: "1.5rem" }}>
          {colors.map((color) => (
            <li key={color} style={{ marginBottom: "0.25rem" }}>
              {color}{" "}
              <button
                type="button"
                onClick={() => removeColor(color)}
                style={linkButtonStyle}
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2 style={sectionHeading}>Especificações técnicas</h2>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <input
          type="text"
          value={specKeyInput}
          onChange={(e) => setSpecKeyInput(e.target.value)}
          placeholder="Ex: Potência"
          style={inputStyle}
        />
        <input
          type="text"
          value={specValueInput}
          onChange={(e) => setSpecValueInput(e.target.value)}
          placeholder="Ex: 3000 W"
          style={inputStyle}
        />
        <button type="button" onClick={addSpec} style={secondaryButtonStyle}>
          Adicionar
        </button>
      </div>
      {specs.length === 0 && (
        <p style={{ color: "#666", marginBottom: "1.5rem" }}>
          Nenhuma especificação adicionada.
        </p>
      )}
      {specs.length > 0 && (
        <ul style={{ paddingLeft: "1.2rem", marginBottom: "1.5rem" }}>
          {specs.map((spec) => (
            <li key={spec.key} style={{ marginBottom: "0.25rem" }}>
              <strong>{spec.key}:</strong> {spec.value}{" "}
              <button
                type="button"
                onClick={() => removeSpec(spec.key)}
                style={linkButtonStyle}
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      {errorMessage && (
        <p role="alert" style={{ color: "#c0392b", marginBottom: "1rem" }}>
          {errorMessage}
        </p>
      )}

      <button type="submit" style={{ padding: "0.5rem 1.5rem" }}>
        {mode === "create" ? "Criar produto" : "Salvar alterações"}
      </button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label htmlFor={htmlFor}>
        {label}
        {required && " *"}
      </label>
      <br />
      {children}
      {hint && (
        <small style={{ display: "block", color: "#666", marginTop: "0.25rem" }}>
          {hint}
        </small>
      )}
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "0.5rem",
  fontFamily: "inherit",
  fontSize: "1rem",
};

const secondaryButtonStyle: CSSProperties = {
  padding: "0.5rem 1rem",
  whiteSpace: "nowrap",
};

const linkButtonStyle: CSSProperties = {
  background: "none",
  border: "none",
  color: "#2563eb",
  cursor: "pointer",
  padding: 0,
  font: "inherit",
  textDecoration: "underline",
};

const sectionHeading: CSSProperties = {
  fontSize: "1.1rem",
  marginTop: "2rem",
  marginBottom: "1rem",
  borderTop: "1px solid #ddd",
  paddingTop: "1rem",
};
