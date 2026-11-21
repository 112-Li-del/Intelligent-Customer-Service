import { Star, StarSolid } from "@medusajs/icons"
import styles from "./peek-rating.module.css"

const stars = [1, 2, 3, 4, 5]

export default function PeekRating({ value }: { value: number }) {
  return (
    <span className={styles.rating} role="img" aria-label={`评分 ${value} / ${stars.length}`}>
      {stars.map((star) => {
        const filled = star <= value
        const Icon = filled ? StarSolid : Star

        return (
          <span key={star} className={styles.star} data-filled={filled} aria-hidden="true">
            <Icon />
          </span>
        )
      })}
      <span className={styles.tip} aria-hidden="true">{value} / {stars.length}</span>
    </span>
  )
}
