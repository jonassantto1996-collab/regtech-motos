"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { createLead } from "@/lib/leads/actions";

type Props = { productId: string };
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

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (modalState === "idle") firstFieldRef.current?.focus();
    else if (modalState === "success") closeSuccessButtonRef.current?.focus();
    else if (modalState === "closed") openButtonRef.current?.focus();
  }, [modalState]);

  useEffect(() => {
    if (modalState === "closed" || modalState === "submitting") return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setModalState("closed");
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
        className="min-h-14 w-full bg-blue-700 px-7 py-4 text-center text-sm font-semibold uppercase tracking-[0.14em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 active:translate-y-0"
      >
        Tenho interesse
      </button>

      {modalState !== "closed" && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-blue-950/70 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Formulário de interesse"
          onClick={closeModal}
        >
          <div
            className="max-h-[92dvh] w-full overflow-y-auto bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 shadow-2xl sm:max-h-none sm:max-w-md sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {modalState === "success" ? (
              <div>
                <p className="text-base leading-7 text-gray-900">{feedbackMessage}</p>
                <button
                  ref={closeSuccessButtonRef}
                  type="button"
                  onClick={closeModal}
                  className="mt-6 min-h-12 w-full bg-gray-950 px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 active:translate-y-0"
                >
                  Fechar
                </button>
              </div>
            ) : (
              isFormVisible && (
                <form onSubmit={handleSubmit}>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
                    Atendimento Regtech
                  </p>
                  <h2 className="mt-2 text-[1.375rem] font-bold tracking-tight text-gray-950 sm:text-2xl">
                    Tenho interesse
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Informe seus dados para continuar pelo WhatsApp.
                  </p>

                  <label htmlFor="lead-full-name" className="mt-6 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-600 sm:mt-7">
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
                    className="min-h-12 w-full border-0 border-b border-gray-300 px-0 py-3 text-base text-gray-950 outline-none focus:border-blue-700 focus:ring-0 disabled:bg-gray-50"
                  />

                  <label htmlFor="lead-whatsapp" className="mt-5 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-600">
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
                    className="min-h-12 w-full border-0 border-b border-gray-300 px-0 py-3 text-base text-gray-950 outline-none focus:border-blue-700 focus:ring-0 disabled:bg-gray-50"
                  />

                  {modalState === "error" && feedbackMessage && (
                    <p role="alert" className="mt-4 text-sm text-red-600">
                      {feedbackMessage}
                    </p>
                  )}

                  <div className="mt-7 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={modalState === "submitting"}
                      className="min-h-12 border border-gray-300 px-4 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-gray-700 transition-all duration-200 hover:border-gray-500 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={modalState === "submitting"}
                      className="min-h-12 bg-gray-950 px-4 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 active:translate-y-0 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50"
                    >
                      {modalState === "submitting" ? "Enviando..." : "Continuar"}
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
