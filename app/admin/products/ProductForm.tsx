import type { CSSProperties, ReactNode } from "react";
import type { Product } from "./types";

type ProductFormProps = {
  mode: "create" | "edit";
  action: (formData: FormData) => void;
  defaultValues?: Partial<Product>;
  errorMessage?: string | null;
};

export function ProductForm({
  mode,
  action,
  defaultValues,
  errorMessage,
}: ProductFormProps) {
  return (
    <form action={action} style={{ maxWidth: 480 }}>
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
