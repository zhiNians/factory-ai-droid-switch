import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white/90 group-[.toaster]:dark:bg-black/90 group-[.toaster]:text-slate-950 group-[.toaster]:dark:text-slate-50 group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:backdrop-blur-md group-[.toaster]:rounded-2xl",
          description: "group-[.toast]:text-slate-500 group-[.toast]:dark:text-slate-400",
          actionButton:
            "group-[.toast]:bg-slate-900 group-[.toast]:text-slate-50 group-[.toast]:dark:bg-slate-50 group-[.toast]:dark:text-slate-900",
          cancelButton:
            "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-500 group-[.toast]:dark:bg-slate-800 group-[.toast]:dark:text-slate-400",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
