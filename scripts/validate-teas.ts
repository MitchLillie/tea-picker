import {TEAS} from '../src/tea/teas'
import {validateTeas} from '../src/tea/validate'

const errors = validateTeas()
if (errors.length) {
  process.stderr.write(`${errors.length} problem(s):\n${errors.map(e => `  • ${e}`).join('\n')}\n`)
  process.exit(1)
}
process.stdout.write(`✓ ${TEAS.length} teas valid\n`)
