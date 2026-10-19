import { cn } from '../../utils/cn'

/**
 * Standard page wrapper.
 * The page title and subtitle live in the top header, so this component only
 * handles the content column, spacing and max width.
 */
export function PageContainer({ children, className, as: Component = 'div' }) {
  return (
    <Component
      className={cn('mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-6', className)}
    >
      {children}
    </Component>
  )
}

export default PageContainer
