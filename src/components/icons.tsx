import jokerSvg from '@/assets/card-joker.svg'
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
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
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
