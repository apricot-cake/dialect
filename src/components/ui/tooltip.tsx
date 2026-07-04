"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"

function TooltipProvider({
  delay = 0,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delay={delay}
      {...props}
    />
  )
}

// タッチ端末はホバーが無く、base-ui のツールチップはタップでは開かない。
// トリガーのタップ(=クリック)でも開閉できるよう、開閉stateをRootとTriggerで共有する。
// ホバー/フォーカスは従来どおり base-ui が onOpenChange 経由で駆動する。
const TooltipToggleContext =
  React.createContext<React.Dispatch<React.SetStateAction<boolean>> | null>(null)

function Tooltip(props: TooltipPrimitive.Root.Props) {
  const [open, setOpen] = React.useState(false)
  return (
    <TooltipToggleContext.Provider value={setOpen}>
      {/* 既定ではツールチップ自体にカーソルを乗せると消えずに残るため無効化 */}
      <TooltipPrimitive.Root
        data-slot="tooltip"
        disableHoverablePopup
        {...props}
        open={open}
        onOpenChange={(o) => setOpen(o)}
      />
    </TooltipToggleContext.Provider>
  )
}

function TooltipTrigger({
  onClick,
  disableTapToggle,
  ...props
}: TooltipPrimitive.Trigger.Props & { disableTapToggle?: boolean }) {
  const setOpen = React.useContext(TooltipToggleContext)
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      onClick={(event) => {
        // 主アクション付き/誤爆しやすいトリガーは disableTapToggle でタップ開閉を無効化する
        if (!disableTapToggle) setOpen?.((o) => !o)
        onClick?.(event)
      }}
      {...props}
    />
  )
}

/**
 * ツールチップ本文が複数文のときは「。」ごとに改行して1文1行にする。
 * 幅での折り返しより文の区切りが読みやすいため。文字列以外(アイコン等)は対象外
 */
function HintLines({ text }: { text: string }) {
  // 「。」の直後で分割し、句点は前の文に残す。末尾の空要素は落とす
  const lines = text.split(/(?<=。)/).filter((s) => s.trim() !== "")
  if (lines.length <= 1) return text
  return (
    <span className="flex flex-col gap-1 text-left">
      {lines.map((line, i) => (
        <span key={i}>{line}</span>
      ))}
    </span>
  )
}

function TooltipContent({
  className,
  side = "top",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            // 白背景(ポップオーバー配色)。ブランド色のアイコンを載せるため暗色にしない
            "z-50 inline-flex w-fit max-w-xs origin-(--transform-origin) items-center gap-1.5 rounded-md border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md has-data-[slot=kbd]:pr-1.5 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        >
          {typeof children === "string" ? <HintLines text={children} /> : children}
          <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] border bg-popover fill-popover data-[side=bottom]:top-1 data-[side=inline-end]:top-1/2! data-[side=inline-end]:-left-1 data-[side=inline-end]:-translate-y-1/2 data-[side=inline-start]:top-1/2! data-[side=inline-start]:-right-1 data-[side=inline-start]:-translate-y-1/2 data-[side=left]:top-1/2! data-[side=left]:-right-1 data-[side=left]:-translate-y-1/2 data-[side=right]:top-1/2! data-[side=right]:-left-1 data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-2.5" />
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
