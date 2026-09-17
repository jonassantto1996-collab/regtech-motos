"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { createLead } from "@/lib/leads/actions";

type Props = {
  productId: string;
};

type ModalState = "closed" | "idle" | "submitting" | "success" | "error";

export default function InterestModal({ productId }: Props) {
  const [modalState, setModalState] = useState<ModalState>("closed");
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const openButtonRef = useRef<HTMLButtonElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const closeSuccessButtonRef = useRef<HTMLButtonElement>(null);
  const isFirstRender = useRef(true);

  // Gerenciamento de foco (Etapa 4.7, Seção 9): ao abrir, o foco vai para o
  // primeiro campo do formulário (ou para o botão "Fechar" quando já chega
  // direto num estado de sucesso); ao fechar, o foco volta para o botão que
  // abriu o modal. Pulado na primeira renderização para não roubar o foco
  // da página assim que ela carrega.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (modalState === "idle") {
      firstFieldRef.current?.focus();
    } else if (modalState === "success") {
      closeSuccessButtonRef.current?.focus();
    } else if (modalState === "closed") {
      openButtonRef.current?.focus();
    }
  }, [modalState]);

  // Fecha com Esc, exceto durante o envio (mesma regra de closeModal — não
  // registra o listener nesse estado, então Esc não tem efeito ali).
  useEffect(() => {
    if (modalState === "closed" || modalState === "submitting") return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setModalState("closed");
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [modalState]);

  function openModal() {
    setFeedbackMessage(null);
    setModalState("idle");
  }

  function closeModal() {
    if (modalState === "submitting") return;
    setModalState("closed");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Evita múltiplos envios acidentais enquanto já há um em andamento.
    if (isPending || modalState === "submitting") return;

    setModalState("submitting");

    startTransition(async () => {
      const result = await createLead({ fullName, whatsapp, productId });

      if (!result.success) {
        setFeedbackMessage(result.error);
        setModalState("error");
        return;
      }

      if (result.whatsappUrl === null) {
        setFeedbackMessage(result.message);
        setModalState("success");
        return;
      }

      setFeedbackMessage(
        "Interesse registrado! Você será direcionado ao WhatsApp agora."
      );
      setModalState("success");
      window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
    });
  }

  const isFormVisible =
    modalState === "idle" || modalState === "submitting" || modalState === "error";

  return (
    <>
      <button
        ref={openButtonRef}
        type="button"
        onClick={openModal}
        className="mt-4 w-full rounded-md bg-green-600 px-6 py-3 text-center text-base font-semibold text-white transition hover:bg-green-700 sm:w-auto"
      >
        Tenho interesse
      </button>

      {modalState !== "closed" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Formulário de interesse"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {modalState === "success" ? (
              <div>
                <p className="text-gray-900">{feedbackMessage}</p>
                <button
                  ref={closeSuccessButtonRef}
                  type="button"
                  onClick={closeModal}
                  className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Fechar
                </button>
              </div>
            ) : (
              isFormVisible && (
                <form onSubmit={handleSubmit}>
                  <h2 className="mb-4 text-lg font-semibold text-gray-900">
                    Tenho interesse
                  </h2>

                  <label
                    htmlFor="lead-full-name"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Nome completo
                  </label>
                  <input
                    ref={firstFieldRef}
                    id="lead-full-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={modalState === "submitting"}
                    className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 disabled:bg-gray-100"
                  />

                  <label
                    htmlFor="lead-whatsapp"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    WhatsApp
                  </label>
                  <input
                    id="lead-whatsapp"
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    required
                    placeholder="(94) 99999-9999"
                    disabled={modalState === "submitting"}
                    className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 disabled:bg-gray-100"
                  />

                  {modalState === "error" && feedbackMessage && (
                    <p role="alert" className="mb-3 text-sm text-red-600">
                      {feedbackMessage}
                    </p>
                  )}

                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={modalState === "submitting"}
                      className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={modalState === "submitting"}
                      className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                      {modalState === "submitting" ? "Enviando..." : "Enviar"}
                    </button>
                  </div>
                </form>
              )
            )}
          </div>
        </div>
      )}
    </>
  );
}
