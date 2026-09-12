import deadSvg from '@/assets/dead-head.svg'
import jokerSvg from '@/assets/card-joker.svg'
import powerSvg from '@/assets/power-button.svg'
import helmetSvg from '@/assets/helmet-head-shot.svg'

/**
 * Renders an SVG file as a CSS mask, so the artwork takes the surrounding text
 * color and works in both themes (a plain `<img>` would keep its own color).
 */
function MaskIcon({ src, className }: { src: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block bg-current ${className ?? ''}`}
      style={{
        WebkitMaskImage: `url("${src}")`,
        maskImage: `url("${src}")`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
      }}
    />
  )
}

/** Wild Card marker: "Card joker" by Delapouite (game-icons.net, CC BY 3.0). */
export function JokerIcon({ className }: { className?: string }) {
  return <MaskIcon src={jokerSvg} className={className} />
}

/** Shaken marker: "Helmet head shot" by Lorc (game-icons.net, CC BY 3.0). */
export function ShakenIcon({ className }: { className?: string }) {
  return <MaskIcon src={helmetSvg} className={className} />
}

/** Incapacitated marker: "Dead head" by Delapouite (game-icons.net, CC BY 3.0). */
export function DeadIcon({ className }: { className?: string }) {
  return <MaskIcon src={deadSvg} className={className} />
}

/** States menu handle: "Power button" by Lord Berandas (game-icons.net, CC BY 3.0). */
export function StatesIcon({ className }: { className?: string }) {
  return <MaskIcon src={powerSvg} className={className} />
}
