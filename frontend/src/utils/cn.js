/**
 * Tiny className joiner.
 * Keeps conditional class logic readable without pulling in a dependency.
 *
 * @param {...(string | false | null | undefined | Array<string | false | null | undefined>)} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  const out = []

  for (const input of inputs) {
    if (!input) continue

    if (Array.isArray(input)) {
      const nested = cn(...input)
      if (nested) out.push(nested)
      continue
    }

    out.push(String(input))
  }

  return out.join(' ')
}

export default cn
