"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export interface FilterConfig {
  name: string;
  type: "text" | "select" | "date";
  placeholder?: string;
  label?: string;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: string;
  className?: string;
}

interface FilterBarModalProps {
  filters: FilterConfig[];
  open: boolean;
  setOpen: (open: boolean) => void;
  onSubmit?: (params: Record<string, string>) => void;
  onClear?: () => void;
  submitLabel?: string;
}

export function FilterBarModal({ filters, open, setOpen, onSubmit, onClear, submitLabel = "Filtrar" }: FilterBarModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formState, setFormState] = useState<Record<string, string>>({});

  const handleChange = (name: string, value: string) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formState);
    } else {
      const url = new URL(window.location.href);
      Object.entries(formState).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
      router.push(url.pathname + url.search);
      setOpen(false);
    }
  };

  const handleClear = () => {
    setFormState({});
    if (onClear) {
      onClear();
    } else {
      router.push(window.location.pathname);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md p-6 rounded-xl !bg-slate-900/95 !border-slate-700">
        <DialogTitle className="mb-4 text-lg font-bold text-center text-white">Filtros avançados</DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-4">
          {filters.map((filter) => {
            const value = formState[filter.name] ?? searchParams?.get(filter.name) ?? "";
            if (filter.type === "text") {
              return (
                <Input
                  key={filter.name}
                  type="text"
                  name={filter.name}
                  value={value}
                  onChange={(e) => handleChange(filter.name, e.target.value)}
                  placeholder={filter.placeholder}
                  className={filter.className ?? "w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-base text-white placeholder:text-slate-500"}
                  aria-label={filter.label || filter.placeholder}
                />
              );
            }
            if (filter.type === "select" && filter.options) {
              return (
                <select
                  key={filter.name}
                  name={filter.name}
                  value={value}
                  onChange={(e) => handleChange(filter.name, e.target.value)}
                  aria-label={filter.label || filter.placeholder}
                  className="w-full h-12 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-base text-white"
                >
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              );
            }
            if (filter.type === "date") {
              return (
                <Input
                  key={filter.name}
                  type="date"
                  name={filter.name}
                  value={value}
                  onChange={(e) => handleChange(filter.name, e.target.value)}
                  placeholder={filter.placeholder}
                  className={filter.className ?? "w-full h-12 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-base text-white"}
                  aria-label={filter.label || filter.placeholder}
                />
              );
            }
            return null;
          })}
          <div className="flex gap-2 justify-end mt-4">
            <Button type="button" variant="outline" onClick={handleClear} className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700">
              Limpar
            </Button>
            <Button type="submit" variant="default" className="bg-blue-600 hover:bg-blue-700 text-white">
              {submitLabel}
            </Button>
          </div>
        </form>
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          aria-label="Fechar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </DialogContent>
    </Dialog>
  );
}

export default FilterBarModal;
