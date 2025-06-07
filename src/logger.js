import createDebug from 'debug';

/**
 * Base debug instance for the project.
 * Enable by setting `DEBUG=markdownlint-trap*`.
 */
const debug = createDebug('markdownlint-trap');

export default debug;
