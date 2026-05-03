import { create } from "zustand";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  type?: "confirm" | "prompt";
  defaultValue?: string;
}

interface ConfirmState {
  isOpen: boolean;
  options: ConfirmOptions | null;
  resolve: ((value: boolean | string | null) => void) | null;
  inputValue: string;
  setInputValue: (val: string) => void;
  show: (opts: ConfirmOptions) => Promise<boolean | string | null>;
  close: (result: boolean | string | null) => void;
}

export const useConfirm = create<ConfirmState>((set, get) => ({
  isOpen: false,
  options: null,
  resolve: null,
  inputValue: "",
  setInputValue: (val) => set({ inputValue: val }),
  show: (opts) => new Promise((resolve) => set({ isOpen: true, options: opts, resolve, inputValue: opts.defaultValue || "" })),
  close: (result) => {
    const { resolve } = get();
    if (resolve) resolve(result);
    set({ isOpen: false, options: null, resolve: null });
  }
}));

export const confirmDialog = async (options: ConfirmOptions): Promise<boolean> => {
  const result = await useConfirm.getState().show({ ...options, type: "confirm" });
  return result as boolean;
};

export const promptDialog = async (options: ConfirmOptions): Promise<string | null> => {
  const result = await useConfirm.getState().show({ ...options, type: "prompt" });
  return result as string | null;
};

export function ConfirmDialog() {
  const { isOpen, options, close, inputValue, setInputValue } = useConfirm();

  if (!options) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && close(options.type === "prompt" ? null : false)}>
      <DialogContent className="sm:max-w-md bg-card border-primary/40 clip-notch p-6 shadow-fire z-[99999]">
        <DialogHeader>
          <DialogTitle className={`font-display text-xl font-black ${options.isDestructive ? 'text-destructive' : 'text-fire-gradient'}`}>
            {options.title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            {options.description}
          </DialogDescription>
        </DialogHeader>
        
        {options.type === "prompt" && (
          <div className="py-4">
            <input 
              autoFocus
              className="w-full bg-background border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && close(inputValue)}
            />
          </div>
        )}

        <DialogFooter className="mt-6 flex gap-3 sm:justify-end">
          <Button variant="ghost" onClick={() => close(options.type === "prompt" ? null : false)}>
            {options.cancelText || "Cancel"}
          </Button>
          <Button 
            variant={options.isDestructive ? "destructive" : "hero"} 
            onClick={() => close(options.type === "prompt" ? inputValue : true)}
          >
            {options.confirmText || "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
