import createDebug from 'debug';

/**
 * Base debug instance for the project.
 * Enable by setting `DEBUG=markdownlint-styleguide*`.
 */
const debug = createDebug('markdownlint-styleguide');

export default debug;
