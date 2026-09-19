"use client";

import { useState, type ReactNode } from "react";
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
    <form action={action} className="product-form">
      {/* Cores e specs vao pro servidor como JSON num campo escondido —
          evita depender de indices alinhados entre multiplos inputs. */}
      <input type="hidden" name="colors_json" value={JSON.stringify(colors)} />
      <input type="hidden" name="specs_json" value={JSON.stringify(specs)} />

      <h2 className="form-section-title">Dados básicos</h2>

      <Field label="Marca" htmlFor="brand" required>
        <input
          id="brand"
          name="brand"
          type="text"
          required
          defaultValue={defaultValues?.brand}
          className="admin-control"
        />
      </Field>

      <Field label="Modelo" htmlFor="model" required>
        <input
          id="model"
          name="model"
          type="text"
          required
          defaultValue={defaultValues?.model}
          className="admin-control"
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
          className="admin-control"
        />
      </Field>

      <Field label="SKU" htmlFor="sku" hint="Opcional. Se informado, deve ser único.">
        <input
          id="sku"
          name="sku"
          type="text"
          defaultValue={defaultValues?.sku ?? ""}
          className="admin-control"
        />
      </Field>

      <Field label="Categoria" htmlFor="category" required>
        <input
          id="category"
          name="category"
          type="text"
          required
          defaultValue={defaultValues?.category}
          className="admin-control"
        />
      </Field>

      <Field label="Descrição" htmlFor="description" required>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          defaultValue={defaultValues?.description}
          className="admin-control admin-textarea"
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
          className="admin-control"
        />
      </Field>

      <Field label="Disponibilidade" htmlFor="availability" required>
        <input
          id="availability"
          name="availability"
          type="text"
          required
          defaultValue={defaultValues?.availability}
          className="admin-control"
        />
      </Field>

      <Field label="Garantia" htmlFor="warranty" required>
        <input
          id="warranty"
          name="warranty"
          type="text"
          required
          defaultValue={defaultValues?.warranty}
          className="admin-control"
        />
      </Field>

      <div className="form-check">
        <label>
          <input
            type="checkbox"
            name="pickup_available"
            defaultChecked={defaultValues?.pickup_available ?? false}
          />{" "}
          Retirada disponível
        </label>
      </div>

      <div className="form-check">
        <label>
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={defaultValues?.is_active ?? true}
          />{" "}
          Produto ativo (visível no catálogo público)
        </label>
      </div>

      {mode === "create" && (
        <div className="form-info">
          <h2 className="form-section-title">Imagens</h2>
          <p className="form-muted">
            Salve o produto primeiro para poder adicionar imagens.
          </p>
        </div>
      )}

      <h2 className="form-section-title">Cores</h2>
      <div className="form-inline">
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
          className="admin-control"
        />
        <button type="button" onClick={addColor} className="admin-secondary-button">
          Adicionar
        </button>
      </div>
      {colors.length === 0 && (
        <p className="form-muted">
          Nenhuma cor adicionada.
        </p>
      )}
      {colors.length > 0 && (
        <ul className="form-token-list">
          {colors.map((color) => (
            <li key={color}>
              {color}{" "}
              <button
                type="button"
                onClick={() => removeColor(color)}
                className="form-remove"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2 className="form-section-title">Especificações técnicas</h2>
      <div className="form-inline">
        <input
          type="text"
          value={specKeyInput}
          onChange={(e) => setSpecKeyInput(e.target.value)}
          placeholder="Ex: Potência"
          className="admin-control"
        />
        <input
          type="text"
          value={specValueInput}
          onChange={(e) => setSpecValueInput(e.target.value)}
          placeholder="Ex: 3000 W"
          className="admin-control"
        />
        <button type="button" onClick={addSpec} className="admin-secondary-button">
          Adicionar
        </button>
      </div>
      {specs.length === 0 && (
        <p className="form-muted">
          Nenhuma especificação adicionada.
        </p>
      )}
      {specs.length > 0 && (
        <ul className="form-token-list">
          {specs.map((spec) => (
            <li key={spec.key}>
              <strong>{spec.key}:</strong> {spec.value}{" "}
              <button
                type="button"
                onClick={() => removeSpec(spec.key)}
                className="form-remove"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      {errorMessage && (
        <p role="alert" className="admin-alert error">
          {errorMessage}
        </p>
      )}

      <button type="submit" className="admin-primary-button">
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
    <div className="form-check">
      <label htmlFor={htmlFor}>
        {label}
        {required && " *"}
      </label>
      {children}
      {hint && (
        <small className="field-hint">
          {hint}
        </small>
      )}
    </div>
  );
}

